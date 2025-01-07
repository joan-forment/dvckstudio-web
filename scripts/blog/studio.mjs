// npm run blog:studio — the daily blog desk on http://localhost:5190.
// Local only: it drives ComfyUI and Claude Code on this computer and can
// publish to Hostinger, so it listens on 127.0.0.1 and every write needs the
// X-Studio header (a page on another site cannot send it without a CORS
// preflight, which this server never approves) and a localhost Host header
// (blocks DNS rebinding).
import fs from "fs";
import http from "http";
import path from "path";
import { exec } from "child_process";
import { CATEGORIES, ROOT, loadDrafts, localToday } from "./content.mjs";
import { comfyAvailable, COVERS_DIR } from "./covers.mjs";
import {
  approve, discardJob, latestProposals, localStamp, makeCovers, nextSlot, proposeTopics,
  readState, release, startJob, taskRunning, unschedule, updateState,
} from "./pipeline.mjs";

const PORT = Number(process.env.STUDIO_PORT || 5190);
const PAGE = path.join(ROOT, "scripts/blog/studio.html");
// Brand CSS, fonts and the blog component script, so the desk looks and
// behaves like the site.
const STATIC = {
  "/css/": path.join(ROOT, "css"),
  "/js/": path.join(ROOT, "js"),
  "/fonts/": path.join(ROOT, "public/fonts"),
  "/icons/": path.join(ROOT, "public/icons"),
};
const TYPES = { ".css": "text/css", ".js": "text/javascript; charset=utf-8", ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg", ".html": "text/html; charset=utf-8" };

// Messages from background work (publish now, proposals) shown on the page.
let feed = [];
const say = (text) => {
  feed = [...feed, `${localStamp().slice(11)} ${text}`].slice(-30);
  console.log(text);
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
}

function serveFile(res, file, cache = "no-store") {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, { error: "No encontrado" });
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": cache });
  fs.createReadStream(file).pipe(res);
}

// Resolves inside base only (no ../ escapes).
const inside = (base, rel) => {
  const full = path.resolve(base, rel);
  return full.startsWith(base + path.sep) ? full : null;
};

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

async function snapshot() {
  const state = readState();
  const busy = new Set(Object.keys(state.jobs));
  let slot = null;
  try {
    slot = nextSlot(state);
  } catch {}
  return {
    today: localToday(),
    comfy: await comfyAvailable(),
    proposing: taskRunning("proposing"),
    publishing: taskRunning("publishing", 30),
    proposals: latestProposals(),
    jobs: Object.values(state.jobs).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    schedule: state.schedule,
    nextSlot: slot,
    drafts: loadDrafts()
      .filter((d) => !busy.has(d.slug))
      .map((d) => ({ slug: d.slug, title: d.title, category: d.category.slug, description: d.description })),
    categories: Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name])),
    feed,
  };
}

// Background work: the request answers at once and the page polls /api/state.
const background = (label, task) =>
  task().catch((error) => say(`✖ ${label}: ${error.message}`));

const actions = {
  propose: () => {
    if (taskRunning("proposing")) throw new Error("Ya se están buscando propuestas.");
    background("Propuestas", () => proposeTopics(say));
  },
  choose: (body) => startJob(body.draft ? { type: "draft", slug: body.draft } : { type: "proposal", date: body.date, index: body.index }),
  covers: (body) => background("Portadas", () => makeCovers(body.slug)),
  approve: (body) =>
    background("Publicar", async () => {
      const at = await approve(body.slug, body.cover, body.when, say);
      if (at) say(`✔ "${body.slug}" programado para ${at}.`);
    }),
  unschedule: (body) => unschedule(body.slug),
  discard: (body) => discardJob(body.slug),
  release: () => background("Publicar", () => release(say)),
};

async function preview(slug) {
  const draft = loadDrafts().find((d) => d.slug === slug);
  if (!draft) return null;
  return {
    title: draft.title,
    description: draft.description,
    words: draft.words,
    minutes: draft.minutes,
    revision: draft.revision,
    warnings: draft.warnings.filter((w) => !/imagen/.test(w)),
    tldr: draft.tldr,
    sources: draft.sources,
    html: draft.html,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || "")) return send(res, 403, { error: "Solo en local" });

  try {
    if (req.method === "POST") {
      if (req.headers["x-studio"] !== "1") return send(res, 403, { error: "Petición no permitida" });
      const action = actions[url.pathname.replace("/api/", "")];
      if (!action) return send(res, 404, { error: "Acción desconocida" });
      const result = await action(await readBody(req));
      return send(res, 200, { ok: true, result: result ?? null });
    }

    if (url.pathname === "/") return serveFile(res, PAGE);
    if (url.pathname === "/api/state") return send(res, 200, await snapshot());
    if (url.pathname.startsWith("/api/preview/")) {
      const data = await preview(decodeURIComponent(url.pathname.slice(13)));
      return data ? send(res, 200, data) : send(res, 404, { error: "Aún no hay borrador" });
    }
    // /covers/<slug>/<id>.jpg -> candidate previews
    if (url.pathname.startsWith("/covers/")) {
      const file = inside(COVERS_DIR, decodeURIComponent(url.pathname.slice(8)));
      // Candidates are never overwritten (new ids), so the page re-renders cheaply.
      return file && file.endsWith(".jpg") ? serveFile(res, file, "private, max-age=86400") : send(res, 404, { error: "No encontrado" });
    }
    for (const [prefix, base] of Object.entries(STATIC)) {
      if (url.pathname.startsWith(prefix)) {
        const file = inside(base, decodeURIComponent(url.pathname.slice(prefix.length)));
        return file ? serveFile(res, file) : send(res, 404, { error: "No encontrado" });
      }
    }
    send(res, 404, { error: "No encontrado" });
  } catch (error) {
    send(res, 400, { error: error.message });
  }
});

// Writing and rendering run inside this process. If it was closed halfway,
// those jobs would wait forever: mark them so the page offers to retry.
updateState((s) => {
  for (const job of Object.values(s.jobs)) {
    if (["writing", "reviewing"].includes(job.status)) {
      job.status = "error";
      job.log = [...(job.log || []), "✖ El estudio se cerró mientras escribía. Descártalo y vuelve a elegirlo."];
    }
    for (const c of job.covers) if (c.status === "pending") c.status = "error";
  }
});

server.listen(PORT, "127.0.0.1", () => {
  const address = `http://localhost:${PORT}`;
  console.log(`Estudio del blog en ${address}  (Ctrl+C para cerrar)`);
  if (!process.argv.includes("--no-open")) exec(`start "" ${address}`);
});
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log(`Ya estaba abierto: http://localhost:${PORT}`);
    exec(`start "" http://localhost:${PORT}`);
  } else throw error;
});
