// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  site: 'https://munkh.xyz',
  base: '/',
  image: {
    // Sharp is auto-detected; set sane quality defaults for <Image> component
    defaultQuality: 80,
  },
  build: {
    // Inline small stylesheets (<= 4 kB) directly into HTML to cut round trips
    inlineStylesheets: 'auto',
  },
  vite: { plugins: [tailwind()] },
});
