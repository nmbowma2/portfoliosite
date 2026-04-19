import fs from "fs";
import path from "path";
import sharp from "sharp";

export const SRC  = path.resolve("public/fotos");
export const OUT  = path.join(SRC, "thumbs");
export const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

fs.mkdirSync(OUT, { recursive: true });

/**
 * Generate a thumbnail for one photo.
 * Returns true if a new thumb was written, false if it was already up-to-date.
 */
export async function makeThumb(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!EXTS.has(ext)) return false;

  const base    = path.parse(path.basename(filePath)).name;
  const outPath = path.join(OUT, `${base}.jpg`);

  // Skip if thumb exists and is at least as new as the source
  try {
    const srcMtime   = fs.statSync(filePath).mtimeMs;
    const thumbMtime = fs.statSync(outPath).mtimeMs;
    if (thumbMtime >= srcMtime) return false;
  } catch {
    // thumb missing — fall through and create it
  }

  try {
    await sharp(filePath)
      .rotate()
      .resize(450, 450, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(outPath);
    return true;
  } catch (e) {
    console.warn("[thumbs] skip:", path.basename(filePath), e.message);
    return false;
  }
}

/** Generate thumbnails for every photo in SRC that is missing or outdated. */
export async function makeAllThumbs(log = true) {
  const files = fs.readdirSync(SRC).filter(f => EXTS.has(path.extname(f).toLowerCase()));
  let count = 0;
  for (const file of files) {
    const made = await makeThumb(path.join(SRC, file));
    if (made) {
      if (log) console.log("[thumbs] generated:", file);
      count++;
    }
  }
  return count;
}
