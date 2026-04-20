import { makeAllThumbs, updateManifest } from "./thumb-utils.mjs";

const n = await makeAllThumbs();
updateManifest();
console.log(`[thumbs] done — ${n} thumbnail(s) generated, manifest updated.`);
