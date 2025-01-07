import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";
import blogPlugin from "./scripts/blog/vite-plugin.mjs";

function cleanRouteFolders() {
  return {
    name: "clean-route-folders",
    apply: "build",
    closeBundle() {
      const distDir = resolve(__dirname, "dist");

      // Keep clean routes working when dist is served by a static server too.
      // Vercel rewrites remain in place, but these folders also make /studio,
      // /work, etc. resolve without hosting-specific routing.
      const cleanRoutes = [
        "studio",
        "work",
        "contact",
        "links",
        "sample-project",
      ];

      cleanRoutes.forEach((route) => {
        const routeDir = resolve(distDir, route);
        fs.mkdirSync(routeDir, { recursive: true });
        fs.copyFileSync(
          resolve(distDir, `${route}.html`),
          resolve(routeDir, "index.html"),
        );
      });
    },
  };
}

export default defineConfig({
  // blogPlugin adds its generated pages (blog.html, blog/**) to the inputs.
  plugins: [blogPlugin(), cleanRouteFolders()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        work: resolve(__dirname, "work.html"),
        "sample-project": resolve(__dirname, "sample-project.html"),
        studio: resolve(__dirname, "studio.html"),
        contact: resolve(__dirname, "contact.html"),
        links: resolve(__dirname, "links.html"),
        "404": resolve(__dirname, "404.html"),
      },
    },
    assetsInclude: [
      "**/*.jpeg",
      "**/*.jpg",
      "**/*.png",
      "**/*.svg",
      "**/*.gif",
    ],
    copyPublicDir: true,
  },
});
