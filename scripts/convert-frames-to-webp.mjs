import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRAMES_DIR = path.resolve(__dirname, "../public/sakura-frames");

async function main() {
  console.log("🌸 Starting Sakura Frames WebP conversion...");
  console.log(`Target directory: ${FRAMES_DIR}`);

  const files = await fs.readdir(FRAMES_DIR);
  const pngFiles = files
    .filter((f) => f.endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  console.log(`Found ${pngFiles.length} PNG frame files.`);

  let totalBeforeBytes = 0;
  let totalAfterBytes = 0;

  // Process in batches of 10 to keep CPU/memory efficient
  const BATCH_SIZE = 10;
  for (let i = 0; i < pngFiles.length; i += BATCH_SIZE) {
    const batch = pngFiles.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (file) => {
        const inputPath = path.join(FRAMES_DIR, file);
        const baseName = path.parse(file).name;
        const outputPath = path.join(FRAMES_DIR, `${baseName}.webp`);

        const statBefore = await fs.stat(inputPath);
        totalBeforeBytes += statBefore.size;

        // Resize to 1280px wide maintaining aspect ratio, convert to WebP at 80% quality
        await sharp(inputPath)
          .resize({ width: 1280, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outputPath);

        const statAfter = await fs.stat(outputPath);
        totalAfterBytes += statAfter.size;

        // Delete the original PNG now that WebP is successfully created
        await fs.unlink(inputPath);
      })
    );

    const percent = Math.round(((i + batch.length) / pngFiles.length) * 100);
    process.stdout.write(`\rConverted ${i + batch.length}/${pngFiles.length} frames (${percent}%)...`);
  }

  console.log("\n\n✅ Conversion completed successfully!");
  console.log(`Total Size Before: ${(totalBeforeBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Total Size After:  ${(totalAfterBytes / (1024 * 1024)).toFixed(2)} MB`);
  const savings = (((totalBeforeBytes - totalAfterBytes) / totalBeforeBytes) * 100).toFixed(1);
  console.log(`Storage Saved:     ${savings}% reduction!`);
}

main().catch((err) => {
  console.error("Conversion failed:", err);
  process.exit(1);
});
