// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  site: 'https://munkh.xyz',
  base: '/',
  vite: { plugins: [tailwind()] },
});
