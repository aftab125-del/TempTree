/**
 * scripts/convert-frame-template.mjs
 * 
 * CLI Wrapper around shared lib/frame-converter.ts
 */

import path from "path";
import {
  DEFAULT_OPTIONS,
  detectPlaceholders,
  generateCutoutBuffer,
  generateCutout,
  buildTemplateRecipe,
  saveFrameAndTemplate,
  convertFrameTemplate,
} from "../lib/frame-converter.ts";

export {
  DEFAULT_OPTIONS,
  detectPlaceholders,
  generateCutoutBuffer,
  generateCutout,
  buildTemplateRecipe,
  saveFrameAndTemplate,
  convertFrameTemplate,
};

// CLI Execution Handler
if (process.argv[1] && process.argv[1].endsWith("convert-frame-template.mjs")) {
  const args = process.argv.slice(2);
  const inputArg = args[0];

  if (!inputArg) {
    console.log(`
Usage:
  node scripts/convert-frame-template.mjs <image-path> [options]

Options:
  --id=<id>                   Unique template ID (e.g. vintage-frame-01)
  --name="<name>"             Template title
  --category=<cat>            Category: Y2K | Minimal | Dreamy | Vintage | Bold (default: Minimal)
  --variance=<num>            Max RGB color variance for flat color detection (default: 15)
  --min-width=<num>           Minimum placeholder width (default: 160)
  --min-height=<num>          Minimum placeholder height (default: 180)
  --detect-plus               Enable center plus-icon verification (default: true)
`);
    process.exit(0);
  }

  const options = {};
  for (const arg of args.slice(1)) {
    if (arg.startsWith("--id=")) options.id = arg.split("=")[1];
    if (arg.startsWith("--name=")) options.name = arg.split("=")[1];
    if (arg.startsWith("--category=")) options.category = arg.split("=")[1];
    if (arg.startsWith("--variance=")) options.maxColorVariance = parseInt(arg.split("=")[1], 10);
    if (arg.startsWith("--min-width=")) options.minWidth = parseInt(arg.split("=")[1], 10);
    if (arg.startsWith("--min-height=")) options.minHeight = parseInt(arg.split("=")[1], 10);
  }

  convertFrameTemplate(path.resolve(inputArg), options)
    .then((res) => {
      console.log(`\nSuccessfully converted frame! Template ID: ${res.template.id}`);
      console.log(`Placeholders detected: ${res.placeholders.length}`);
      console.log(`Cutout saved: ${res.cutoutPath}`);
    })
    .catch((err) => {
      console.error("Conversion failed:", err);
      process.exit(1);
    });
}
