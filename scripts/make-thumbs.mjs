import fs from "fs";
import path from "path";
import sharp from "sharp";

const SRC = path.resolve("public/fotos");
const OUT = path.join(SRC, "thumbs");
fs.mkdirSync(OUT, { recursive: true });

const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const files = fs.readdirSync(SRC).filter(f => exts.has(path.extname(f).toLowerCase()));

for (const file of files) {
  const inPath = path.join(SRC, file);
  const base = path.parse(file).name; // keep same basename
  const outPath = path.join(OUT, `${base}.jpg`); // normalize to jpg

  try {
    const img = sharp(inPath).rotate(); // respect EXIF orientation
    const meta = await img.metadata();

    // Target 450px on the long edge — 2× the largest display size (225px) for retina
    await img
      .resize(450, 450, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(outPath);

    console.log("thumb ->", outPath);
  } catch (e) {
    console.warn("skip:", file, e.message);
  }
}
