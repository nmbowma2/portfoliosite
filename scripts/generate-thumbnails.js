// Supported image extensions (inputs we handle)
const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

// --- generateThumbnail: preserve original extension ---
async function generateThumbnail(file) {
  const inPath = path.join(SRC, file);
  const { name, ext } = path.parse(file);
  const outExt = ext.toLowerCase();                    // keep original extension
  const outPath = path.join(OUT, `${name}${outExt}`);

  try {
    const img = sharp(inPath).rotate();                // respect EXIF orientation
    const meta = await img.metadata();

    const w = Math.max(1, Math.round((meta.width  || 1000) * 0.1));
    const h = Math.max(1, Math.round((meta.height || 1000) * 0.1));

    let pipeline = img.resize(w, h, {
      fit: "inside",
      withoutEnlargement: true
    });

    // Choose encoder based on original extension
    switch (outExt) {
      case ".png":
        // Good for preserving transparency
        await pipeline.png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          effort: 7                           // tradeoff speed/ratio
        }).toFile(outPath);
        break;

      case ".webp":
        await pipeline.webp({
          quality: 78,                        // adjust to taste
          effort: 4,                          // encoding speed/ratio
          alphaQuality: 85                    // for transparency
        }).toFile(outPath);
        break;

      case ".avif":
        await pipeline.avif({
          quality: 50,                        // AVIF scale is different; ~45–60 is common
          effort: 4
        }).toFile(outPath);
        break;

      case ".jpg":
      case ".jpeg":
      default:
        await pipeline.jpeg({
          quality: 78,
          mozjpeg: true
        }).toFile(outPath);
        break;
    }

    console.log("Thumbnail created:", outPath);
  } catch (e) {
    console.warn("Failed to generate thumbnail for:", file, e.message);
  }
}

// --- deleteThumbnail: match original extension ---
function deleteThumbnail(file) {
  const { name, ext } = path.parse(file);
  const thumbPath = path.join(OUT, `${name}${ext.toLowerCase()}`);

  if (fs.existsSync(thumbPath)) {
    fs.unlinkSync(thumbPath);
    console.log("Thumbnail deleted:", thumbPath);
  }
}
