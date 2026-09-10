import fs from "fs";
import path from "path";
import sharp from "sharp";
import {
  detectPlaceholders,
  generateCutoutBuffer,
  buildTemplateRecipe,
  saveFrameAndTemplate,
} from "../lib/frame-converter.ts";

async function main() {
  const imagePath = "d:/temptree/scratch/ticket-to-happiness.jpg";
  const templateId = "vintage-ticket-to-happiness";
  const templateName = "Ticket to Happiness Collage";
  const category = "Vintage";

  console.log(`Converting ${imagePath} into template '${templateId}'...`);

  // Detect slots with updated engine
  const detection = await detectPlaceholders(imagePath, {
    maxColorVariance: 18,
    erosionMargin: 2,
    minWidth: 150,
    minHeight: 150,
  });

  // Filter only true photo slots (black polaroids and white camera screen)
  // Exclude the pink ticket header (Slot 1)
  const photoPlaceholders = detection.placeholders.filter(
    (p) => p.color === "#000000" || p.color === "#FFFFFF"
  );

  console.log(`Kept ${photoPlaceholders.length} photo placeholder slots:`);
  photoPlaceholders.forEach((p, i) => {
    console.log(`  Photo Slot #${i + 1}: cx=${p.cx}, cy=${p.cy}, w=${p.width}, h=${p.height}, rot=${p.rotation}, color=${p.color}`);
  });

  // Generate transparent cutout buffer
  const cutout = await generateCutoutBuffer(imagePath, photoPlaceholders, {
    maxColorVariance: 18,
    erosionMargin: 2,
  });

  // Build template recipe
  const template = buildTemplateRecipe(
    {
      id: templateId,
      name: templateName,
      category,
      description: "Vintage scrapbooked collage with retro digital camera, dried flowers, and tilted polaroid frames.",
      tags: ["Vintage", "Polaroid", "Scrapbook", "Collage", "Story"],
      accentColor: "#E2B4BD",
      publicCutoutUrl: `/frames/${templateId}-frame.png`,
    },
    photoPlaceholders
  );

  // Save frame PNG and update templates.json
  const saveRes = await saveFrameAndTemplate({
    template,
    cutoutBuffer: cutout.buffer,
    framesDir: path.resolve("./public/frames"),
    templatesJsonPath: path.resolve("./data/templates.json"),
  });

  console.log(`Template saved successfully!`);
  console.log(`Cutout frame: ${saveRes.cutoutPath}`);
  console.log(`Template ID: ${saveRes.template.id}`);
}

main().catch(console.error);
