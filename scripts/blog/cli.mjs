// Blog workflow from the terminal:
//   npm run blog                    queue status + "publish the next draft?" prompt
//   npm run blog:publish [-- slug]  publish the next draft (or that one) and build
//   npm run blog:unpublish -- slug  move a post back to the drafts queue
//   npm run blog:draft [-- N]       Claude Code writes a new draft, then a second session fact-checks it
//   npm run blog:studio             daily desk: 10 proposals, covers, schedule (see studio.mjs)
//   npm run blog:propose            scheduled 07:00: today's 10 proposals for the studio
//   npm run blog:release            scheduled 09:00: publishes the post due now and uploads it
//   npm run blog:deploy [-- --full] uploads dist/ to Hostinger (changed files only)
import fs from "fs";
import path from "path";
import readline from "readline";
import { DRAFTS_DIR, POSTS_DIR, ROOT, loadDrafts, loadPosts, localToday } from "./content.mjs";
import { askClaude, run } from "./claude.mjs";
import { deploy } from "./deploy.mjs";
import { proposeTopics, publishDraft, readProposals, release } from "./pipeline.mjs";

const [command = "status", arg] = process.argv.slice(2);
const rel = (file) => path.relative(ROOT, file).replace(/\\/g, "/");

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => (rl.close(), resolve(answer.trim()))));
}

// Oldest draft first, but skip ahead one if it repeats the category of the
// last published post, so the blog alternates topics day to day.
function queue() {
  const drafts = loadDrafts();
  const last = loadPosts()[0];
  const index = last ? drafts.findIndex((d) => d.category.slug !== last.category.slug) : 0;
  if (index > 0) drafts.unshift(...drafts.splice(index, 1));
  return drafts;
}

function describe(draft, index) {
  console.log(`\n  ${index === 0 ? "▶ Siguiente" : `  ${index + 1}.`}  ${draft.title}`);
  console.log(`     ${draft.category.name} · ${draft.words} palabras · ${draft.minutes} min · ${rel(draft.file)}`);
  if (index === 0) console.log(`     ${draft.description}`);
  if (index === 0 && draft.revision) console.log(`     Nota del revisor: ${draft.revision}`);
  draft.warnings.forEach((w) => console.log(`     ⚠ ${w}`));
}

function publish(draft) {
  publishDraft(draft.slug);
  console.log(`\n✔ Publicado: ${draft.title}\n  ${rel(path.join(POSTS_DIR, `${draft.slug}.md`))} · https://dvckstudio.com/blog/${draft.slug}`);
}

async function buildAndReport() {
  console.log("\nGenerando la web (npm run build)…\n");
  if (!(await run("npm", ["run", "build"])).ok) {
    console.error("\n✖ El build ha fallado. Revisa el error de arriba; el post ya está en content/blog/posts.");
    process.exit(1);
  }
  console.log("\n✔ Build listo en dist/. Súbelo con npm run blog:deploy para que el post salga en dvckstudio.com.");
}

function status() {
  const posts = loadPosts();
  const drafts = queue();
  console.log(`\nBlog de DvckStudio: ${posts.length} publicados · ${drafts.length} borradores en cola`);
  if (posts[0]) console.log(`Último publicado: ${posts[0].date} · ${posts[0].title}`);
  if (!drafts.length) {
    console.log("\nNo hay borradores. Crea uno con: npm run blog:draft");
    return drafts;
  }
  drafts.slice(0, 5).forEach(describe);
  if (drafts.length > 5) console.log(`\n  … y ${drafts.length - 5} más.`);
  console.log("\nPara leerlo antes: npm run dev y abre http://localhost:5173/blog (los borradores salen marcados).");
  return drafts;
}

async function main() {
  if (command === "status") {
    const drafts = status();
    if (!drafts.length || !process.stdin.isTTY) return;
    const answer = await ask(`\n¿Publicar ahora "${drafts[0].title}"? (s/N) `);
    if (!/^s(i|í)?$/i.test(answer)) return console.log("Vale, no se publica nada.");
    publish(drafts[0]);
    await buildAndReport();
    return;
  }

  if (command === "publish") {
    const drafts = queue();
    const draft = arg ? drafts.find((d) => d.slug === arg) : drafts[0];
    if (!draft) {
      console.error(arg ? `✖ No hay ningún borrador "${arg}".` : "✖ No hay borradores en la cola.");
      process.exit(1);
    }
    publish(draft);
    await buildAndReport();
    return;
  }

  if (command === "unpublish") {
    const file = arg && path.join(POSTS_DIR, `${arg}.md`);
    if (!file || !fs.existsSync(file)) {
      console.error("✖ Uso: npm run blog:unpublish -- <slug-del-post>");
      process.exit(1);
    }
    fs.renameSync(file, path.join(DRAFTS_DIR, `${arg}.md`));
    console.log(`✔ ${arg} vuelve a borradores. Haz npm run build para quitarlo de la web.`);
    return;
  }

  if (command === "draft") {
    // Optional cap for the scheduled task: `npm run blog:draft -- 10` only
    // writes a new draft while fewer than 10 are waiting for review.
    const cap = Number(arg);
    const waiting = loadDrafts().length;
    if (cap > 0 && waiting >= cap) {
      console.log(`Hay ${waiting} borradores esperando (límite ${cap}). Hoy no se escribe ninguno.`);
      return;
    }
    const existing = [...loadPosts(), ...loadDrafts()]
      .map((p) => `- [${p.category.slug}] ${p.title} (/blog/${p.slug})${p.isDraft ? " — borrador" : ""}`)
      .join("\n");
    const today = localToday();
    const writerPrompt = fs
      .readFileSync(path.join(ROOT, "scripts/blog/writer-prompt.md"), "utf8")
      .replaceAll("{{TODAY}}", today)
      .replace("{{EXISTING}}", existing || "- (todavía ninguno)");

    const before = new Set(fs.readdirSync(DRAFTS_DIR));
    console.log("1/2 · Claude está investigando y escribiendo un borrador nuevo (tarda unos minutos)…");
    const wrote = (await askClaude(writerPrompt, "writer", { tools: ["WebSearch", "WebFetch"], writable: "content/blog/drafts/**" })).ok;
    const created = fs.readdirSync(DRAFTS_DIR).filter((name) => !before.has(name) && name.endsWith(".md"));
    if (!wrote || !created.length) {
      console.error("✖ No se ha creado ningún borrador.");
      process.exit(1);
    }

    // A fresh session fact-checks and edits each new draft before anyone
    // reads it, and leaves a note for the team in the "revision" field.
    for (const name of created) {
      console.log(`\n2/2 · Otra sesión de Claude revisa ${name} y verifica cada dato…`);
      const file = `content/blog/drafts/${name}`;
      const reviewerPrompt = fs
        .readFileSync(path.join(ROOT, "scripts/blog/reviewer-prompt.md"), "utf8")
        .replaceAll("{{TODAY}}", today)
        .replaceAll("{{FILE}}", file);
      if (!(await askClaude(reviewerPrompt, "reviewer", { tools: ["WebSearch", "WebFetch"], writable: file })).ok) console.error(`⚠ La revisión de ${name} no ha terminado bien.`);
    }

    // Validates the new files the same way the build will.
    try {
      loadDrafts();
    } catch (error) {
      console.error(`✖ El borrador no es válido todavía:\n${error.message}`);
      process.exit(1);
    }
    console.log(`\n✔ Borrador nuevo: content/blog/drafts/${created.join(", ")}\n  Revísalo con npm run blog.`);
    return;
  }

  if (command === "propose") {
    // Weekdays only, like the releases: nothing to choose from on a weekend.
    const day = new Date().getDay();
    if ((day === 0 || day === 6) && arg !== "--force") return console.log("Fin de semana: hoy no hay propuestas.");
    // The studio button may have run it already today.
    if (readProposals() && arg !== "--force") return console.log("Ya hay propuestas de hoy.");
    await proposeTopics();
    return;
  }

  if (command === "release") {
    await release();
    return;
  }

  if (command === "deploy") {
    await deploy({ full: arg === "--full" });
    return;
  }

  console.error(`Comando desconocido: ${command}`);
  process.exit(1);
}

main().catch((error) => {
  console.error(`✖ ${error.message}`);
  process.exit(1);
});
