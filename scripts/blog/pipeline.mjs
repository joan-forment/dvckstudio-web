// The daily blog pipeline shared by the studio page (studio.mjs) and the
// scheduled tasks (cli.mjs propose / release):
//   07:00  proposeTopics()  10 current topics, saved per day
//   studio startJob()       Claude writes + fact-checks, ComfyUI renders 3 covers
//   studio approve()        cover applied, post scheduled for the next free
//                           weekday 09:00 (or published now)
//   09:00  release()        publishes what is due, builds and uploads to Hostinger
// State lives in content/studio/state.json (outside content/blog, so the dev
// server does not rebuild the blog on every progress update). Every change re-reads the
// file first (updateState), because the studio and the scheduled task are
// separate processes.
import fs from "fs";
import path from "path";
import { DRAFTS_DIR, POSTS_DIR, ROOT, loadDrafts, loadPosts, localToday } from "./content.mjs";
import { askClaude, extractJson, run } from "./claude.mjs";
import { COVERS_DIR, applyCover, renderCandidate, sceneIdeas, setFrontMatterField } from "./covers.mjs";
import { deploy } from "./deploy.mjs";

export const STUDIO_DIR = path.join(ROOT, "content/studio");
const PROPOSALS_DIR = path.join(STUDIO_DIR, "proposals");
const STATE_FILE = path.join(STUDIO_DIR, "state.json");
export const RELEASE_TIME = "09:00";
const PROPOSAL_CATEGORIES = ["ia", "desarrollo", "diseno"];

// State ------------------------------------------------------------------

export function readState() {
  try {
    return { jobs: {}, schedule: [], tasks: {}, ...JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) };
  } catch {
    return { jobs: {}, schedule: [], tasks: {} };
  }
}

export function updateState(change) {
  const state = readState();
  change(state);
  fs.mkdirSync(STUDIO_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  return state;
}

const updateJob = (slug, change) => updateState((s) => s.jobs[slug] && change(s.jobs[slug]));

function jobLog(slug, message) {
  const line = `${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} ${message}`;
  updateJob(slug, (job) => (job.log = [...(job.log || []), line].slice(-40)));
}

// A long task flag ("proposing", "publishing") with a start time, so a crashed
// run does not block the button forever.
export function taskRunning(name, maxMinutes = 45) {
  const started = readState().tasks[name];
  return Boolean(started) && Date.now() - started < maxMinutes * 60_000;
}
const setTask = (name, on) => updateState((s) => (on ? (s.tasks[name] = Date.now()) : delete s.tasks[name]));

// Local "YYYY-MM-DD HH:MM", comparable as a string (Spanish time, like localToday).
export const localStamp = (date = new Date()) => date.toLocaleString("sv-SE").slice(0, 16);

// Proposals ----------------------------------------------------------------

const existingList = () =>
  [...loadPosts(), ...loadDrafts()]
    .map((p) => `- [${p.category.slug}] ${p.title} (/blog/${p.slug})${p.isDraft ? " — borrador" : ""}`)
    .join("\n");

export function readProposals(date = localToday()) {
  const file = path.join(PROPOSALS_DIR, `${date}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

// Most recent day with proposals, so the studio still shows yesterday's list
// on a day the task did not run.
export function latestProposals() {
  if (!fs.existsSync(PROPOSALS_DIR)) return null;
  const last = fs.readdirSync(PROPOSALS_DIR).filter((n) => n.endsWith(".json")).sort().pop();
  return last ? readProposals(last.replace(/\.json$/, "")) : null;
}

function recentProposalTitles(days = 14) {
  if (!fs.existsSync(PROPOSALS_DIR)) return [];
  const since = new Date(Date.now() - days * 86_400_000).toLocaleDateString("sv-SE");
  return fs
    .readdirSync(PROPOSALS_DIR)
    .filter((n) => n.endsWith(".json") && n >= since)
    .flatMap((n) => JSON.parse(fs.readFileSync(path.join(PROPOSALS_DIR, n), "utf8")).proposals.map((p) => `- ${p.title}`));
}

export async function proposeTopics(log = console.log) {
  if (taskRunning("proposing")) throw new Error("Ya se están buscando propuestas.");
  setTask("proposing", true);
  try {
    const today = localToday();
    const prompt = fs
      .readFileSync(path.join(ROOT, "scripts/blog/proposer-prompt.md"), "utf8")
      .replaceAll("{{TODAY}}", today)
      .replace("{{EXISTING}}", existingList() || "- (todavía ninguno)")
      .replace("{{RECENT}}", recentProposalTitles().join("\n") || "- (ninguna)");
    log("Claude está buscando las novedades de hoy (tarda unos minutos)…");
    const { ok, output } = await askClaude(prompt, "proposer", { tools: ["WebSearch", "WebFetch"], capture: true });
    if (!ok) throw new Error(`Claude no ha terminado bien:\n${output.slice(-600)}`);

    const taken = new Set([...loadPosts(), ...loadDrafts()].map((p) => p.slug));
    const proposals = (extractJson(output).proposals || [])
      .filter((p) => p && p.title && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) && !taken.has(p.slug))
      .filter((p) => !/duck\s*studio/i.test(p.title))
      .map((p) => ({ ...p, category: PROPOSAL_CATEGORIES.includes(p.category) ? p.category : "ia" }))
      .slice(0, 10);
    if (!proposals.length) throw new Error("La respuesta no trae propuestas válidas.");

    fs.mkdirSync(PROPOSALS_DIR, { recursive: true });
    fs.writeFileSync(path.join(PROPOSALS_DIR, `${today}.json`), JSON.stringify({ date: today, proposals }, null, 2));
    log(`✔ ${proposals.length} propuestas guardadas para ${today}.`);
    return proposals;
  } finally {
    setTask("proposing", false);
  }
}

// Jobs: one post being prepared ---------------------------------------------

// source: { type: "proposal", date, index }, { type: "proposal", proposal }
// (a brief written outside the daily list) or { type: "draft", slug }.
// Runs in the background of the studio process; progress goes to state.json.
export function startJob(source) {
  let job;
  if (source.type === "proposal") {
    const proposal = source.proposal || readProposals(source.date)?.proposals?.[source.index];
    if (!proposal) throw new Error("Esa propuesta ya no existe.");
    job = { slug: proposal.slug, title: proposal.title, description: proposal.angle, category: proposal.category, proposal };
  } else {
    const draft = loadDrafts().find((d) => d.slug === source.slug);
    if (!draft) throw new Error("Ese borrador ya no existe.");
    job = { slug: draft.slug, title: draft.title, description: draft.description, category: draft.category.slug };
  }
  if (readState().jobs[job.slug]) throw new Error("Ese artículo ya está en preparación.");
  if (fs.existsSync(path.join(POSTS_DIR, `${job.slug}.md`))) throw new Error("Ese artículo ya está publicado.");

  const written = fs.existsSync(path.join(DRAFTS_DIR, `${job.slug}.md`));
  updateState((s) => {
    s.jobs[job.slug] = {
      ...job,
      source: source.type,
      status: written ? "ready" : "writing",
      covers: [],
      chosenCover: null,
      createdAt: new Date().toISOString(),
      log: [],
    };
  });
  if (!written) writeArticle(job.slug).catch((e) => failJob(job.slug, e));
  makeCovers(job.slug).catch((e) => jobLog(job.slug, `✖ Portadas: ${e.message}`));
  return job.slug;
}

function failJob(slug, error) {
  jobLog(slug, `✖ ${error.message}`);
  updateJob(slug, (job) => (job.status = "error"));
}

async function writeArticle(slug) {
  const { proposal } = readState().jobs[slug];
  const file = `content/blog/drafts/${slug}.md`;
  const today = localToday();
  const sources = (proposal.sources || []).map((s) => `  - ${s.title}: ${s.url}${s.date ? ` (${s.date})` : ""}`).join("\n");
  const assigned = `

## Tema asignado (manda sobre la sección "Tema")

El equipo ya ha elegido el tema: no busques otro.

- Título de trabajo: ${proposal.title} (puedes mejorarlo si respetas las reglas)
- Categoría: ${proposal.category}
- Enfoque: ${proposal.angle}
- Por qué ahora: ${proposal.why}
- Palabra clave: ${proposal.keyword || "la del título"}
- Fuentes de partida (ábrelas, verifícalas y amplía):
${sources || "  - (ninguna: búscalas tú)"}

Guarda el artículo exactamente en \`${file}\`.
`;
  const writerPrompt =
    fs
      .readFileSync(path.join(ROOT, "scripts/blog/writer-prompt.md"), "utf8")
      .replaceAll("{{TODAY}}", today)
      .replace("{{EXISTING}}", existingList() || "- (todavía ninguno)") + assigned;

  jobLog(slug, "Claude está escribiendo el artículo…");
  const wrote = await askClaude(writerPrompt, `writer-${slug}`, { tools: ["WebSearch", "WebFetch"], writable: file, capture: true });
  if (!wrote.ok || !fs.existsSync(path.join(ROOT, file))) throw new Error("Claude no ha creado el borrador.");

  updateJob(slug, (job) => (job.status = "reviewing"));
  jobLog(slug, "Otra sesión de Claude comprueba cada dato…");
  const reviewerPrompt = fs
    .readFileSync(path.join(ROOT, "scripts/blog/reviewer-prompt.md"), "utf8")
    .replaceAll("{{TODAY}}", today)
    .replaceAll("{{FILE}}", file);
  const reviewed = await askClaude(reviewerPrompt, `reviewer-${slug}`, { tools: ["WebSearch", "WebFetch"], writable: file, capture: true });
  if (!reviewed.ok) jobLog(slug, "⚠ La revisión no ha terminado bien: léelo con calma antes de publicar.");

  // Same validation as the build: a broken front matter shows up here, not at 09:00.
  const draft = loadDrafts().find((d) => d.slug === slug);
  if (!draft) throw new Error("El borrador no es válido.");
  updateJob(slug, (job) => {
    job.status = "ready";
    job.title = draft.title;
    job.description = draft.description;
  });
  jobLog(slug, "✔ Artículo listo para leer.");
}

// Adds three new cover candidates to the job (first run or "otras 3").
export async function makeCovers(slug) {
  const job = readState().jobs[slug];
  if (!job) throw new Error("No existe ese trabajo.");
  if (job.covers.some((c) => c.status === "pending")) throw new Error("Ya se están generando portadas.");
  const firstId = job.covers.length + 1;
  const ids = [firstId, firstId + 1, firstId + 2].map(String);
  updateJob(slug, (j) => j.covers.push(...ids.map((id) => ({ id, status: "pending" }))));

  try {
    jobLog(slug, "Pensando tres ideas de portada…");
    const ideas = await sceneIdeas(job);
    for (const [i, id] of ids.entries()) {
      const idea = ideas[i % ideas.length];
      updateJob(slug, (j) => Object.assign(j.covers.find((c) => c.id === id), idea));
      try {
        await renderCandidate(slug, id, idea.scene);
        updateJob(slug, (j) => (j.covers.find((c) => c.id === id).status = "ready"));
      } catch (error) {
        updateJob(slug, (j) => (j.covers.find((c) => c.id === id).status = "error"));
        jobLog(slug, `✖ Portada ${id}: ${error.message}`);
      }
    }
  } catch (error) {
    updateJob(slug, (j) => j.covers.filter((c) => ids.includes(c.id)).forEach((c) => (c.status = "error")));
    throw error;
  }
}

export function discardJob(slug) {
  updateState((s) => {
    delete s.jobs[slug];
    s.schedule = s.schedule.filter((item) => item.slug !== slug);
  });
}

// Scheduling -----------------------------------------------------------------

const isWeekday = (date) => date.getDay() >= 1 && date.getDay() <= 5;

// Next weekday at RELEASE_TIME that has no post yet: today if it is still
// early and nothing went out today, otherwise the following weekdays.
export function nextSlot(state = readState()) {
  const taken = new Set(state.schedule.map((item) => item.at.slice(0, 10)));
  const publishedToday = loadPosts().some((p) => p.date === localToday());
  const [hours, minutes] = RELEASE_TIME.split(":").map(Number);
  const day = new Date();
  day.setHours(hours, minutes, 0, 0);
  for (let i = 0; i < 60; i++) {
    const stamp = localStamp(day);
    const isToday = i === 0;
    const free = !taken.has(stamp.slice(0, 10)) && !(isToday && (publishedToday || day < new Date()));
    if (isWeekday(day) && free) return stamp;
    day.setDate(day.getDate() + 1);
  }
  throw new Error("No hay huecos libres en los próximos 60 días.");
}

// Applies the chosen cover, then schedules the post or publishes it now.
export async function approve(slug, coverId, when = "scheduled", log = console.log) {
  const job = readState().jobs[slug];
  if (!job || job.status !== "ready") throw new Error("El artículo aún no está listo.");
  const cover = job.covers.find((c) => c.id === coverId && c.status === "ready");
  if (!cover) throw new Error("Elige una portada generada.");

  await applyCover(slug, coverId);
  setFrontMatterField(path.join(DRAFTS_DIR, `${slug}.md`), "imageAlt", cover.alt || job.title);
  updateJob(slug, (j) => (j.chosenCover = coverId));

  if (when === "now") {
    await publishNow(slug, log);
    return null;
  }
  const at = nextSlot();
  updateState((s) => {
    s.schedule = [...s.schedule.filter((item) => item.slug !== slug), { slug, at }].sort((a, b) => a.at.localeCompare(b.at));
    s.jobs[slug].status = "scheduled";
    s.jobs[slug].scheduledAt = at;
  });
  jobLog(slug, `✔ Programado para ${at}.`);
  return at;
}

export function unschedule(slug) {
  updateState((s) => {
    s.schedule = s.schedule.filter((item) => item.slug !== slug);
    if (s.jobs[slug]) {
      s.jobs[slug].status = "ready";
      delete s.jobs[slug].scheduledAt;
    }
  });
}

// Publishing -----------------------------------------------------------------

// Writes today's date into the front matter and moves the file to posts/.
export function publishDraft(slug) {
  const source = path.join(DRAFTS_DIR, `${slug}.md`);
  const target = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(source)) throw new Error(`No existe el borrador ${slug}.`);
  if (fs.existsSync(target)) throw new Error(`Ya existe content/blog/posts/${slug}.md`);
  const today = localToday();
  let text = fs.readFileSync(source, "utf8");
  const end = text.indexOf("\n---", 4);
  let head = text.slice(0, end);
  head = /^date:.*$/m.test(head) ? head.replace(/^date:.*$/m, `date: ${today}`) : head.replace(/^(description:.*)$/m, `$1\ndate: ${today}`);
  text = head + text.slice(end);
  fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(target, text);
  fs.unlinkSync(source);
}

export async function buildSite(log = console.log) {
  log("Generando la web (npm run build)…");
  const { ok, output } = await run("npm", ["run", "build"], { capture: true });
  if (!ok) throw new Error(`El build ha fallado:\n${output.slice(-1500)}`);
}

async function publishNow(slug, log) {
  if (taskRunning("publishing", 30)) throw new Error("Ya hay una publicación en marcha.");
  setTask("publishing", true);
  try {
    publishDraft(slug);
    updateState((s) => {
      s.schedule = s.schedule.filter((item) => item.slug !== slug);
      if (s.jobs[slug]) s.jobs[slug].status = "publishing";
    });
    await buildSite(log);
    await deploy({ log });
    // Keep only the chosen render; the others are ~2 MB each and never used.
    const chosen = readState().jobs[slug]?.chosenCover;
    const dir = path.join(COVERS_DIR, slug);
    if (chosen && fs.existsSync(dir))
      for (const name of fs.readdirSync(dir)) if (name !== `${chosen}.png`) fs.rmSync(path.join(dir, name));
    updateState((s) => {
      if (s.jobs[slug]) {
        s.jobs[slug].status = "published";
        s.jobs[slug].publishedAt = localStamp();
      }
    });
    log(`✔ Publicado: https://dvckstudio.com/blog/${slug}`);
  } catch (error) {
    // The post stays in posts/: the next release or a manual deploy retries the upload.
    updateJob(slug, (j) => (j.status = "error"));
    throw error;
  } finally {
    setTask("publishing", false);
  }
}

// Scheduled task at RELEASE_TIME: publishes the oldest due post (one per run).
export async function release(log = console.log) {
  const due = readState().schedule.find((item) => item.at <= localStamp());
  if (!due) {
    log("Nada programado para ahora.");
    return null;
  }
  log(`Publicando ${due.slug} (programado para ${due.at})…`);
  await publishNow(due.slug, log);
  return due.slug;
}
