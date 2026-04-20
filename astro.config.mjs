// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";
import path from "path";

function autoThumbsPlugin() {
  return {
    name: "auto-thumbs",

    // Runs before every build (and on dev server start).
    // Generates thumbnails for any photo that is new or updated, then
    // writes photos-manifest.json so fotos.astro picks up the full list.
    async buildStart() {
      const { makeAllThumbs, updateManifest } = await import("./scripts/thumb-utils.mjs");
      const n = await makeAllThumbs();
      updateManifest();
      if (n > 0) console.log(`[thumbs] generated ${n} thumbnail(s)`);
    },

    // In dev mode: watch the fotos folder and process new/changed photos live.
    // Writing the manifest file is what triggers Vite to recompile fotos.astro
    // because the page imports the manifest — Vite tracks that dependency.
    configureServer(server) {
      Promise.all([
        import("./scripts/thumb-utils.mjs"),
        import("chokidar"),
      ]).then(([{ makeThumb, updateManifest, SRC, EXTS }, { default: chokidar }]) => {
        const watcher = chokidar.watch(SRC, {
          ignored: /[/\\]thumbs[/\\]/,
          ignoreInitial: true,
          awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
        });

        async function processPhoto(filePath) {
          if (!EXTS.has(path.extname(filePath).toLowerCase())) return;
          const made = await makeThumb(filePath);
          if (made) {
            updateManifest();
            console.log("[thumbs] manifest updated — page will reload");
          }
        }

        watcher.on("add", (filePath) => {
          console.log("[thumbs] new photo:", path.basename(filePath));
          processPhoto(filePath);
        });

        watcher.on("change", (filePath) => {
          console.log("[thumbs] photo updated:", path.basename(filePath));
          processPhoto(filePath);
        });

        server.httpServer?.once("close", () => watcher.close());
      });
    },
  };
}

export default defineConfig({
  site: "https://munkh.xyz",
  base: "/",
  image: {
    defaultQuality: 80,
  },
  build: {
    inlineStylesheets: "auto",
  },
  vite: {
    plugins: [tailwind(), autoThumbsPlugin()],
  },
});
