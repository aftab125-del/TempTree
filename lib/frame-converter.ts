/**
 * lib/frame-converter.ts
 *
 * Shared Frame-Template Detection & Conversion Engine
 * ----------------------------------------------------------------------------
 * Powers both the /admin/convert-template web interface and the CLI script.
 *
 * Detects flat-color rectangular placeholder regions (black, maroon, dark green,
 * white, etc.) using low color variance scanning, generates transparent cutout
 * PNGs, and constructs TempTree template recipes.
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";
import type { Template, TemplateElement, Category } from "../types/template";

export interface FrameDetectionOptions {
  maxColorVariance?: number;
  minWidth?: number;
  minHeight?: number;
  minArea?: number;
  minAspectRatio?: number;
  maxAspectRatio?: number;
  maxCanvasCoverage?: number;
  minRectangularity?: number;
  detectPlusIcon?: boolean;
  targetWidth?: number;
  targetHeight?: number;
  contrastThreshold?: number;
}

export const DEFAULT_OPTIONS: Required<FrameDetectionOptions> = {
  maxColorVariance: 22,
  minWidth: 120,
  minHeight: 120,
  minArea: 20000,
  minAspectRatio: 0.35,
  maxAspectRatio: 3.0,
  maxCanvasCoverage: 0.85,
  minRectangularity: 0.65,
  detectPlusIcon: true,
  targetWidth: 1080,
  targetHeight: 1920,
  contrastThreshold: 28,
};

export interface DetectedSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rgb: { r: number; g: number; b: number };
  hasPlusIcon: boolean;
  rectangularity: number;
  area: number;
}

export interface DetectionResult {
  dimensions: { width: number; height: number };
  originalDimensions: { width: number; height: number };
  placeholders: DetectedSlot[];
  resizedOriginalBase64: string;
}

/**
 * Checks if a pixel at (x, y) has a color within variance of the base color
 */
export function isColorClose(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
  maxVariance: number
): boolean {
  return (
    Math.abs(r1 - r2) <= maxVariance &&
    Math.abs(g1 - g2) <= maxVariance &&
    Math.abs(b1 - b2) <= maxVariance
  );
}

/**
 * Checks if a small cross / "+" icon exists near the center (cx, cy)
 */
export function checkPlusIcon(
  data: Uint8Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  baseR: number,
  baseG: number,
  baseB: number,
  variance: number
): boolean {
  const radius = 24;
  let contrastCount = 0;
  let horizontalBar = 0;
  let verticalBar = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = cx + dx;
      const py = cy + dy;
      if (px < 0 || px >= width || py < 0 || py >= height) continue;

      const idx = (py * width + px) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const isDifferent = !isColorClose(r, g, b, baseR, baseG, baseB, variance * 2);
      if (isDifferent) {
        contrastCount++;
        if (Math.abs(dy) <= 3 && Math.abs(dx) <= 18) horizontalBar++;
        if (Math.abs(dx) <= 3 && Math.abs(dy) <= 18) verticalBar++;
      }
    }
  }

  return horizontalBar >= 10 && verticalBar >= 10 && contrastCount >= 25 && contrastCount <= 350;
}

/**
 * Detects all flat-color rectangular placeholder regions in an image.
 */
export async function detectPlaceholders(
  imageBufferOrPath: Buffer | string,
  userOptions: FrameDetectionOptions = {}
): Promise<DetectionResult> {
  const options: Required<FrameDetectionOptions> = { ...DEFAULT_OPTIONS, ...userOptions };

  const image = sharp(imageBufferOrPath);
  const metadata = await image.metadata();

  const originalWidth = metadata.width || 1080;
  const originalHeight = metadata.height || 1920;

  // Render to 1080x1920 raw RGBA buffer and also get PNG base64 for preview
  const resizedSharp = image.resize(options.targetWidth, options.targetHeight, { fit: "fill" });
  
  const [rawObj, resizedPngBuffer] = await Promise.all([
    resizedSharp.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    resizedSharp.clone().png().toBuffer(),
  ]);

  const { data, info } = rawObj;
  const width = info.width;
  const height = info.height;
  const totalCanvasArea = width * height;

  const step = 8;
  const visited = new Uint8Array(width * height);
  const candidateRegions: DetectedSlot[] = [];

  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const startIdx = y * width + x;
      if (visited[startIdx]) continue;

      const pIdx = startIdx * 4;
      const baseR = data[pIdx];
      const baseG = data[pIdx + 1];
      const baseB = data[pIdx + 2];
      const baseA = data[pIdx + 3];

      if (baseA < 128) continue;

      const queue = [x, y];
      visited[startIdx] = 1;

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let pixelCount = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;

      let head = 0;
      while (head < queue.length) {
        const curX = queue[head++];
        const curY = queue[head++];
        pixelCount++;

        if (curX < minX) minX = curX;
        if (curX > maxX) maxX = curX;
        if (curY < minY) minY = curY;
        if (curY > maxY) maxY = curY;

        const curPIdx = (curY * width + curX) * 4;
        sumR += data[curPIdx];
        sumG += data[curPIdx + 1];
        sumB += data[curPIdx + 2];

        const neighbors = [
          [curX + step, curY],
          [curX - step, curY],
          [curX, curY + step],
          [curX, curY - step],
        ];

        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nIdx = ny * width + nx;
          if (visited[nIdx]) continue;

          const npIdx = nIdx * 4;
          const nr = data[npIdx];
          const ng = data[npIdx + 1];
          const nb = data[npIdx + 2];

          if (isColorClose(baseR, baseG, baseB, nr, ng, nb, options.maxColorVariance)) {
            visited[nIdx] = 1;
            queue.push(nx, ny);
          }
        }
      }

      const boxWidth = maxX - minX + step;
      const boxHeight = maxY - minY + step;
      const boxArea = boxWidth * boxHeight;
      const actualPixels = pixelCount * step * step;

      // 1. Minimum size requirement
      if (boxWidth < options.minWidth || boxHeight < options.minHeight) continue;
      if (actualPixels < options.minArea) continue;

      // 2. Reject canvas-spanning background fills
      const touchesAllBorders =
        minX <= step * 2 &&
        maxX >= width - step * 2 &&
        minY <= step * 2 &&
        maxY >= height - step * 2;
      const coversTooMuch = actualPixels > totalCanvasArea * options.maxCanvasCoverage;

      if (touchesAllBorders || coversTooMuch) continue;

      // 3. Rectangularity / density check
      const rectangularity = actualPixels / boxArea;
      if (rectangularity < options.minRectangularity) continue;

      // 4. Aspect ratio check
      const aspectRatio = boxWidth / boxHeight;
      if (aspectRatio < options.minAspectRatio || aspectRatio > options.maxAspectRatio) continue;

      // 5. Mean color & hex
      const meanR = Math.round(sumR / pixelCount);
      const meanG = Math.round(sumG / pixelCount);
      const meanB = Math.round(sumB / pixelCount);
      const hexColor = `#${((1 << 24) + (meanR << 16) + (meanG << 8) + meanB)
        .toString(16)
        .slice(1)
        .toUpperCase()}`;

      // 6. Plus-icon check
      const centerX = Math.round((minX + maxX) / 2);
      const centerY = Math.round((minY + maxY) / 2);
      const hasPlusIcon = options.detectPlusIcon
        ? checkPlusIcon(data, width, height, centerX, centerY, meanR, meanG, meanB, options.maxColorVariance)
        : false;

      candidateRegions.push({
        x: Math.max(0, minX),
        y: Math.max(0, minY),
        width: Math.min(width - minX, boxWidth),
        height: Math.min(height - minY, boxHeight),
        color: hexColor,
        rgb: { r: meanR, g: meanG, b: meanB },
        hasPlusIcon,
        rectangularity: Math.round(rectangularity * 100) / 100,
        area: actualPixels,
      });
    }
  }

  // ==========================================================================
  // MODE 2: BACKGROUND-CONTRAST WINDOW SEGMENTATION
  // ==========================================================================
  // Detects rectangular openings where placeholder slots contain gradients,
  // blurred mock photos, or frosted textures contrasting from the frame backdrop.
  const borderSamples: [number, number, number][] = [];
  const borderInset = 28;
  const sampleSpacing = 16;

  for (let x = borderInset; x < width - borderInset; x += sampleSpacing) {
    const topIdx = (borderInset * width + x) * 4;
    borderSamples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
    const botIdx = ((height - borderInset - 1) * width + x) * 4;
    borderSamples.push([data[botIdx], data[botIdx + 1], data[botIdx + 2]]);
  }
  for (let y = borderInset; y < height - borderInset; y += sampleSpacing) {
    const leftIdx = (y * width + borderInset) * 4;
    borderSamples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
    const rightIdx = (y * width + (width - borderInset - 1)) * 4;
    borderSamples.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
  }

  if (borderSamples.length > 0) {
    borderSamples.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
    const medianBg = borderSamples[Math.floor(borderSamples.length / 2)];
    const bgR = medianBg[0];
    const bgG = medianBg[1];
    const bgB = medianBg[2];

    const cStep = 10;
    const cGridW = Math.floor(width / cStep);
    const cGridH = Math.floor(height / cStep);
    const cMask = new Uint8Array(cGridW * cGridH);

    for (let gy = 0; gy < cGridH; gy++) {
      for (let gx = 0; gx < cGridW; gx++) {
        const px = gx * cStep;
        const py = gy * cStep;
        const idx = (py * width + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (a < 128) continue;

        const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        if (dist > options.contrastThreshold) {
          cMask[gy * cGridW + gx] = 1;
        }
      }
    }

    const cVisited = new Uint8Array(cGridW * cGridH);

    for (let gy = 1; gy < cGridH - 1; gy++) {
      for (let gx = 1; gx < cGridW - 1; gx++) {
        const mIdx = gy * cGridW + gx;
        if (cMask[mIdx] === 0 || cVisited[mIdx]) continue;

        const cQueue = [gx, gy];
        cVisited[mIdx] = 1;

        let minGx = gx, maxGx = gx, minGy = gy, maxGy = gy;
        let cCount = 0;
        let cSumR = 0, cSumG = 0, cSumB = 0;

        let head = 0;
        while (head < cQueue.length) {
          const curGx = cQueue[head++];
          const curGy = cQueue[head++];
          cCount++;

          if (curGx < minGx) minGx = curGx;
          if (curGx > maxGx) maxGx = curGx;
          if (curGy < minGy) minGy = curGy;
          if (curGy > maxGy) maxGy = curGy;

          const pIdx = (curGy * cStep * width + curGx * cStep) * 4;
          cSumR += data[pIdx];
          cSumG += data[pIdx + 1];
          cSumB += data[pIdx + 2];

          const cNeighbors = [
            [curGx + 1, curGy],
            [curGx - 1, curGy],
            [curGx, curGy + 1],
            [curGx, curGy - 1],
          ];

          for (const [nx, ny] of cNeighbors) {
            if (nx < 0 || nx >= cGridW || ny < 0 || ny >= cGridH) continue;
            const nIdx = ny * cGridW + nx;
            if (cVisited[nIdx] || cMask[nIdx] === 0) continue;
            cVisited[nIdx] = 1;
            cQueue.push(nx, ny);
          }
        }

        const boxWidth = (maxGx - minGx + 1) * cStep;
        const boxHeight = (maxGy - minGy + 1) * cStep;
        const boxArea = boxWidth * boxHeight;
        const actualPixels = cCount * cStep * cStep;

        if (boxWidth < options.minWidth || boxHeight < options.minHeight) continue;
        if (actualPixels < options.minArea) continue;

        const touchesAllBorders =
          minGx <= 2 &&
          maxGx >= cGridW - 3 &&
          minGy <= 2 &&
          maxGy >= cGridH - 3;
        const coversTooMuch = actualPixels > totalCanvasArea * options.maxCanvasCoverage;
        if (touchesAllBorders || coversTooMuch) continue;

        const rectangularity = actualPixels / boxArea;
        if (rectangularity < options.minRectangularity) continue;

        const aspectRatio = boxWidth / boxHeight;
        if (aspectRatio < options.minAspectRatio || aspectRatio > options.maxAspectRatio) continue;

        const meanR = Math.round(cSumR / cCount);
        const meanG = Math.round(cSumG / cCount);
        const meanB = Math.round(cSumB / cCount);
        const hexColor = `#${((1 << 24) + (meanR << 16) + (meanG << 8) + meanB)
          .toString(16)
          .slice(1)
          .toUpperCase()}`;

        candidateRegions.push({
          x: Math.max(0, minGx * cStep),
          y: Math.max(0, minGy * cStep),
          width: Math.min(width - minGx * cStep, boxWidth),
          height: Math.min(height - minGy * cStep, boxHeight),
          color: hexColor,
          rgb: { r: meanR, g: meanG, b: meanB },
          hasPlusIcon: false,
          rectangularity: Math.round(rectangularity * 100) / 100,
          area: actualPixels,
        });
      }
    }
  }

  // Deduplicate overlapping candidate boxes
  const filtered: DetectedSlot[] = [];
  candidateRegions.sort((a, b) => b.area - a.area);

  for (const candidate of candidateRegions) {
    const isContained = filtered.some((existing) => {
      const overlapX = Math.max(0, Math.min(existing.x + existing.width, candidate.x + candidate.width) - Math.max(existing.x, candidate.x));
      const overlapY = Math.max(0, Math.min(existing.y + existing.height, candidate.y + candidate.height) - Math.max(existing.y, candidate.y));
      const overlapArea = overlapX * overlapY;
      return overlapArea > candidate.area * 0.5;
    });

    if (!isContained) {
      filtered.push(candidate);
    }
  }

  filtered.sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));

  return {
    dimensions: { width, height },
    originalDimensions: { width: originalWidth, height: originalHeight },
    placeholders: filtered,
    resizedOriginalBase64: `data:image/png;base64,${resizedPngBuffer.toString("base64")}`,
  };
}

/**
 * Generates transparent cutout frame PNG buffer (punching holes in detected slots).
 */
export async function generateCutoutBuffer(
  imageBufferOrPath: Buffer | string,
  placeholders: DetectedSlot[],
  userOptions: FrameDetectionOptions = {}
): Promise<{ buffer: Buffer; base64: string }> {
  const options: Required<FrameDetectionOptions> = { ...DEFAULT_OPTIONS, ...userOptions };

  const { data, info } = await sharp(imageBufferOrPath)
    .resize(options.targetWidth, options.targetHeight, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  for (const p of placeholders) {
    const startX = Math.max(0, p.x);
    const endX = Math.min(width, p.x + p.width);
    const startY = Math.max(0, p.y);
    const endY = Math.min(height, p.y + p.height);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = (y * width + x) * 4;
        data[idx + 3] = 0; // Alpha = 0 (transparent)
      }
    }
  }

  const pngBuffer = await sharp(data, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return {
    buffer: pngBuffer,
    base64: `data:image/png;base64,${pngBuffer.toString("base64")}`,
  };
}

/**
 * Writes the transparent cutout frame PNG to a file path.
 */
export async function generateCutout(
  imageBufferOrPath: Buffer | string,
  outputPath: string,
  placeholders: DetectedSlot[],
  userOptions: FrameDetectionOptions = {}
): Promise<string> {
  const { buffer } = await generateCutoutBuffer(imageBufferOrPath, placeholders, userOptions);
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

/**
 * Creates template JSON recipe structure with photo placeholders beneath
 * and cutout frame overlay on top.
 */
export function buildTemplateRecipe(
  config: {
    id: string;
    name: string;
    category: Category;
    description?: string;
    tags?: string[];
    accentColor?: string;
    publicCutoutUrl?: string;
  },
  placeholders: DetectedSlot[]
): Template {
  const samplePhotos = [
    "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1000&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1000&auto=format&fit=crop&q=80",
  ];

  const elements: TemplateElement[] = [];

  // Photo placeholder slots (underneath)
  placeholders.forEach((p, idx) => {
    elements.push({
      id: `photo-placeholder-${idx + 1}`,
      type: "image",
      left: p.x,
      top: p.y,
      width: p.width,
      height: p.height,
      src: samplePhotos[idx % samplePhotos.length],
      placeholderLabel: placeholders.length > 1 ? `Replace Photo #${idx + 1}` : "Tap to replace photo",
      isPlaceholder: true,
      stroke: "#FFF5F5",
      strokeWidth: 2,
    });
  });

  // Cutout frame overlay (on top)
  elements.push({
    id: "frame-cutout-overlay",
    type: "image",
    left: 0,
    top: 0,
    width: 1080,
    height: 1920,
    src: config.publicCutoutUrl || `/frames/${config.id}-frame.png`,
    selectable: false,
    isPlaceholder: false,
  });

  return {
    id: config.id,
    name: config.name,
    category: config.category,
    description: config.description || "Custom story frame template with dynamic photo placeholders.",
    tags: config.tags || ["Frame", "Aesthetic", config.category, "Story"],
    accentColor: config.accentColor || "#E2B4BD",
    thumbnailUrl: config.publicCutoutUrl || `/frames/${config.id}-frame.png`,
    layoutJson: {
      width: 1080,
      height: 1920,
      backgroundColor: "#4A4A4A",
      elements,
    },
  };
}

/**
 * Saves the transparent frame PNG to public/frames/ and appends the recipe to templates.json.
 */
export async function saveFrameAndTemplate(params: {
  template: Template;
  cutoutBuffer: Buffer;
  framesDir?: string;
  templatesJsonPath?: string;
}): Promise<{ cutoutPath: string; template: Template }> {
  const framesDir = params.framesDir || path.resolve("./public/frames");
  const templatesJsonPath = params.templatesJsonPath || path.resolve("./data/templates.json");

  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  const cutoutFilename = `${params.template.id}-frame.png`;
  const cutoutPath = path.join(framesDir, cutoutFilename);

  fs.writeFileSync(cutoutPath, params.cutoutBuffer);

  // Append or update templates.json
  if (fs.existsSync(templatesJsonPath)) {
    const raw = fs.readFileSync(templatesJsonPath, "utf-8");
    const templates: Template[] = JSON.parse(raw);

    const existingIdx = templates.findIndex((t) => t.id === params.template.id);
    if (existingIdx >= 0) {
      templates[existingIdx] = params.template;
    } else {
      templates.push(params.template);
    }

    fs.writeFileSync(templatesJsonPath, JSON.stringify(templates, null, 2), "utf-8");
  }

  return { cutoutPath, template: params.template };
}

/**
 * High-level helper for CLI execution
 */
export async function convertFrameTemplate(
  inputPath: string,
  config: {
    id?: string;
    name?: string;
    category?: Category;
    description?: string;
    tags?: string[];
    accentColor?: string;
    templatesJsonPath?: string;
    framesDir?: string;
  } & FrameDetectionOptions = {}
) {
  const id = config.id || `frame-${(config.category || "minimal").toLowerCase()}-${Date.now().toString(36)}`;
  const detection = await detectPlaceholders(inputPath, config);
  const cutout = await generateCutoutBuffer(inputPath, detection.placeholders, config);
  
  const template = buildTemplateRecipe(
    {
      id,
      name: config.name || "Custom Aesthetic Frame",
      category: config.category || "Minimal",
      description: config.description,
      tags: config.tags,
      accentColor: config.accentColor,
      publicCutoutUrl: `/frames/${id}-frame.png`,
    },
    detection.placeholders
  );

  const saveRes = await saveFrameAndTemplate({
    template,
    cutoutBuffer: cutout.buffer,
    framesDir: config.framesDir,
    templatesJsonPath: config.templatesJsonPath,
  });

  return {
    template: saveRes.template,
    cutoutPath: saveRes.cutoutPath,
    placeholders: detection.placeholders,
  };
}
