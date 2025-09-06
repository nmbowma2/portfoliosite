// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  site: 'https://nmbowma2.github.io',
  base: '/portfoliosite',
  vite: { plugins: [tailwind()] },
});
