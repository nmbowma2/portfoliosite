import fs from "fs";
import path from "path";
import sharp from "sharp";
import chokidar from "chokidar";

// Directories
const SRC = path.resolve("public/fotos");
const OUT = path.join(SRC, "thumbs");
fs.mkdirSync(OUT, { recursive: true });

// Supported image extensions
const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

// Thumbnail generation function
async function generateThumbnail(file) {
  const inPath = path.join(SRC, file);
  const base = path.parse(file).name; // Keep the basename
  const outPath = path.join(OUT, `${base}.jpg`); // Normalize to .jpg extension

  try {
    const img = sharp(inPath).rotate(); // Respect EXIF orientation
    const meta = await img.metadata();

    // Scale by factor 0.1
    const w = Math.max(1, Math.round((meta.width || 1000) * 0.1));
    const h = Math.max(1, Math.round((meta.height || 1000) * 0.1));

    await img
      .resize(w, h, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(outPath);

    console.log("Thumbnail created:", outPath);
  } catch (e) {
    console.warn("Failed to generate thumbnail for:", file, e.message);
  }
}

// Function to delete the thumbnail
function deleteThumbnail(file) {
  const base = path.parse(file).name;
  const thumbPath = path.join(OUT, `${base}.jpg`);

  // Check if the thumbnail exists and delete it
  if (fs.existsSync(thumbPath)) {
    fs.unlinkSync(thumbPath);
    console.log("Thumbnail deleted:", thumbPath);
  }
}

// Watch the directory for new files, deletions, and changes
const watcher = chokidar.watch(SRC, {
  ignored: /^\./, // Ignore hidden files
  persistent: true,
  ignoreInitial: true, // Don't trigger on startup
});

// Event listener for when new files are added
watcher.on('add', (filePath) => {
  const fileName = path.basename(filePath);

  // Check if the file is an image with a supported extension
  if (exts.has(path.extname(fileName).toLowerCase())) {
    console.log('New file detected:', fileName);
    generateThumbnail(fileName); // Generate the thumbnail
  }
});

// Event listener for when files are deleted
watcher.on('unlink', (filePath) => {
  const fileName = path.basename(filePath);

  // Check if the file is an image with a supported extension
  if (exts.has(path.extname(fileName).toLowerCase())) {
    console.log('File deleted:', fileName);
    deleteThumbnail(fileName); // Delete the corresponding thumbnail
  }
});

// Initial scan for existing images in the folder
fs.readdirSync(SRC)
  .filter(f => exts.has(path.extname(f).toLowerCase())) // Filter valid image extensions
  .forEach(file => generateThumbnail(file)); // Generate thumbnails for all existing images

console.log("Watching for new image files and deletions...");
