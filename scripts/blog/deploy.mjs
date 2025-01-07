// Uploads dist/ to Hostinger over FTP (FTPS when the server allows it).
// Credentials live outside the project, in the Windows credential vault
// (~/.dvckstudio/hostinger.env only as a fallback), so they can never end up
// in dist/ or in a copy of the repo.
// Only files whose content changed since the last upload are sent (hashes in
// ~/.dvckstudio/deploy-manifest.json), and nothing on the server is deleted:
// old hashed assets stay behind, harmless, for pages still cached somewhere.
import { spawnSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "basic-ftp";
import { ROOT } from "./content.mjs";

const CONFIG_DIR = path.join(os.homedir(), ".dvckstudio");
const ENV_FILE = path.join(CONFIG_DIR, "hostinger.env");
const MANIFEST = path.join(CONFIG_DIR, "deploy-manifest.json");
const DIST = path.join(ROOT, "dist");

function readVault() {
  if (process.platform !== "win32") return null;
  const script =
    "$ErrorActionPreference='Stop';[void][Windows.Security.Credentials.PasswordVault,Windows.Security.Credentials,ContentType=WindowsRuntime];" +
    "$c=(New-Object Windows.Security.Credentials.PasswordVault).Retrieve('dvckstudio','hostinger.env');$c.RetrievePassword();$c.Password";
  const result = spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", script], { encoding: "utf8" });
  return result.status === 0 ? Buffer.from(result.stdout.trim(), "base64").toString("utf8") : null;
}

function readConfig() {
  const text = readVault() ?? (fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf8") : null);
  if (!text) throw new Error("Faltan los datos FTP de Hostinger en el almacen de credenciales de Windows.");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2];
  }
  for (const key of ["FTP_HOST", "FTP_USER", "FTP_PASSWORD"])
    if (!env[key]) throw new Error(`Falta ${key} en los datos FTP de Hostinger.`);
  return env;
}

function listFiles(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full, base) : [path.relative(base, full).replace(/\\/g, "/")];
  });
}

const hash = (file) => crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex");

export async function connect(log = console.log) {
  const env = readConfig();
  const client = new Client(30_000);
  const options = { host: env.FTP_HOST, port: Number(env.FTP_PORT || 21), user: env.FTP_USER, password: env.FTP_PASSWORD };
  // Try encrypted first; fall back to plain FTP only if the server refuses TLS.
  // The host is an IP, so the certificate name cannot match: encryption still
  // hides the password on the wire, it just does not authenticate the server.
  try {
    await client.access({ ...options, secure: true, secureOptions: { rejectUnauthorized: false } });
  } catch (error) {
    if (/530|login|auth/i.test(error.message) && !/tls|ssl/i.test(error.message)) throw error;
    log("  (el servidor no acepta FTPS; uso FTP normal)");
    client.close();
    await client.access({ ...options, secure: false });
  }
  const root = env.FTP_ROOT && env.FTP_ROOT !== "/" ? env.FTP_ROOT : "";
  if (root) await client.cd(root);
  return client;
}

export async function deploy({ log = console.log, full = false } = {}) {
  if (!fs.existsSync(path.join(DIST, "index.html"))) throw new Error("No hay build en dist/. Ejecuta npm run build primero.");
  const previous = !full && fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  const current = {};
  const changed = [];
  for (const file of listFiles(DIST)) {
    current[file] = hash(path.join(DIST, file));
    if (previous[file] !== current[file]) changed.push(file);
  }
  if (!changed.length) {
    log("Nada que subir: el servidor ya tiene esta versión.");
    return 0;
  }

  log(`Subiendo ${changed.length} archivos a Hostinger…`);
  const client = await connect(log);
  const remoteRoot = await client.pwd();
  try {
    // Pages last, so a new page never points at assets that are not there yet.
    const isPage = (f) => f.endsWith(".html");
    changed.sort((a, b) => isPage(a) - isPage(b) || a.localeCompare(b));
    let done = 0;
    for (const file of changed) {
      await client.cd(remoteRoot);
      const dir = path.posix.dirname(file);
      if (dir !== ".") await client.ensureDir(dir);
      await client.uploadFrom(path.join(DIST, file), path.posix.basename(file));
      // Record progress as we go, so a dropped connection resumes where it stopped.
      previous[file] = current[file];
      if (++done % 25 === 0 || done === changed.length) {
        fs.writeFileSync(MANIFEST, JSON.stringify(previous));
        log(`  ${done}/${changed.length}`);
      }
    }
  } finally {
    client.close();
  }
  log("✔ Web actualizada en dvckstudio.com");
  await pingIndexNow(changed, log);
  return changed.length;
}

// IndexNow tells Bing (and DuckDuckGo, Yahoo, Yandex… which share it) which
// pages changed, so a new post is crawled in hours instead of weeks. Google
// ignores it; for Google the sitemap in Search Console does the job.
const INDEXNOW_KEY = "09279787d54e3e2a018813dbe1869c63";
const NOT_INDEXED = new Set(["/404", "/sample-project"]);

async function pingIndexNow(changed, log) {
  const urls = [
    ...new Set(
      changed
        .filter((f) => f.endsWith(".html"))
        // studio.html and studio/index.html are the same clean URL.
        .map((f) => "/" + f.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, ""))
        .map((route) => route.replace(/\/$/, "") || "/")
        .filter((route) => !NOT_INDEXED.has(route))
    ),
  ].map((route) => `https://dvckstudio.com${route}`);
  if (!urls.length) return;
  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "dvckstudio.com",
        key: INDEXNOW_KEY,
        keyLocation: `https://dvckstudio.com/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    log(`  IndexNow: ${urls.length} URL avisadas (HTTP ${response.status})`);
  } catch (error) {
    // Never fail a deploy because a search engine did not answer.
    log(`  IndexNow no respondió: ${error.message}`);
  }
}

// npm run blog:deploy [-- --full | --check]
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const flag = process.argv[2];
  const task =
    flag === "--check"
      ? connect().then(async (client) => {
          console.log(`Conectado. Carpeta: ${await client.pwd()}`);
          console.log((await client.list()).map((f) => `  ${f.isDirectory ? "📁" : "  "} ${f.name}`).join("\n"));
          client.close();
        })
      : deploy({ full: flag === "--full" });
  task.catch((error) => {
    console.error(`✖ ${error.message}`);
    process.exit(1);
  });
}
