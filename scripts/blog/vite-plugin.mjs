// Vite plugin: generates the blog before Vite reads its HTML entries.
// Build: published posts only. Dev: drafts too (with a "Borrador" badge and
// noindex), regenerated whenever a file in content/blog changes.
import fs from "fs";
import path from "path";
import { IMAGES_DIR, ROOT } from "./content.mjs";
import { generateBlog } from "./generate.mjs";

const CONTENT_DIR = path.join(ROOT, "content/blog");

export default function blogPlugin() {
  let result = null;

  const run = (includeDrafts, logger = console) => {
    result = generateBlog({ includeDrafts });
    result.warnings.forEach((w) => logger.warn(`[blog] ${w}`));
    return result;
  };

  return {
    name: "dvck-blog",

    config(_, { command }) {
      const { pages } = run(command === "serve");
      const input = {};
      for (const page of pages) {
        // blog.html -> "blog", blog/foo.html -> "blog/foo"
        input[page.replace(/\.html$/, "")] = path.join(ROOT, page);
      }
      return { build: { rollupOptions: { input } } };
    },

    configureServer(server) {
      // Covers are found by file name, so a new image also regenerates the HTML.
      server.watcher.add([CONTENT_DIR, IMAGES_DIR]);
      const onChange = (file) => {
        const changed = path.resolve(file);
        if (!changed.startsWith(CONTENT_DIR) && !changed.startsWith(IMAGES_DIR)) return;
        try {
          run(true, server.config.logger);
          server.ws.send({ type: "full-reload" });
        } catch (error) {
          server.config.logger.error(`[blog] ${error.message}`);
        }
      };
      server.watcher.on("change", onChange);
      server.watcher.on("add", onChange);
      server.watcher.on("unlink", onChange);

      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/blog/rss.xml") return next();
        res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
        res.end(result.rss);
      });
    },

    generateBundle() {
      this.emitFile({ type: "asset", fileName: "blog/rss.xml", source: result.rss });
    },

    // Same trick as cleanRouteFolders in vite.config.js: /blog/foo also works
    // on static hosts that only resolve folder indexes.
    closeBundle() {
      const dist = path.join(ROOT, "dist");
      if (!fs.existsSync(path.join(dist, "blog.html"))) return;
      for (const page of result.pages) {
        const from = path.join(dist, page);
        const to = path.join(dist, page.replace(/\.html$/, ""), "index.html");
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(from, to);
      }
    },
  };
}
