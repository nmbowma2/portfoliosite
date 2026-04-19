import { makeAllThumbs } from "./thumb-utils.mjs";

const n = await makeAllThumbs();
console.log(`[thumbs] done — ${n} thumbnail(s) generated.`);
