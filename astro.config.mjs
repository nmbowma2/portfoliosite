// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";
import path from "path";

function autoThumbsPlugin() {
  return {
    name: "auto-thumbs",

    // Runs before every build (and on dev server start).
    // Generates thumbnails for any photo that is new or updated.
    async buildStart() {
      const { makeAllThumbs } = await import("./scripts/thumb-utils.mjs");
      const n = await makeAllThumbs();
      if (n > 0) console.log(`[thumbs] generated ${n} thumbnail(s)`);
    },

    // In dev mode: watch the fotos folder and process new/changed photos live.
    configureServer(server) {
      Promise.all([
        import("./scripts/thumb-utils.mjs"),
        import("chokidar"),
      ]).then(([{ makeThumb, SRC, EXTS }, { default: chokidar }]) => {
        const watcher = chokidar.watch(SRC, {
          ignored: /[/\\]thumbs[/\\]/,   // never watch the thumbs subfolder
          ignoreInitial: true,            // existing files handled by buildStart
          awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
        });

        const invalidateFotos = () => {
          const fotosPath = path.resolve("src/pages/fotos.astro");
          const mods = server.moduleGraph.getModulesByFile(fotosPath);
          if (mods) mods.forEach(m => server.moduleGraph.invalidateModule(m));
        };

        watcher.on("add", async (filePath) => {
          if (!EXTS.has(path.extname(filePath).toLowerCase())) return;
          console.log("[thumbs] new photo:", path.basename(filePath));
          const made = await makeThumb(filePath);
          if (made) {
            console.log("[thumbs] thumbnail ready — reloading");
            invalidateFotos();
            server.hot.send({ type: "full-reload" });
          }
        });

        watcher.on("change", async (filePath) => {
          if (!EXTS.has(path.extname(filePath).toLowerCase())) return;
          console.log("[thumbs] photo updated:", path.basename(filePath));
          const made = await makeThumb(filePath);
          if (made) {
            console.log("[thumbs] thumbnail updated — reloading");
            invalidateFotos();
            server.hot.send({ type: "full-reload" });
          }
        });

        // Clean up watcher when the dev server shuts down
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
