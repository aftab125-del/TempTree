/**
 * app/api/admin/convert-frame/route.ts
 *
 * Admin API Route for Frame Template Conversion
 * -------------------------------------------------------------
 * Supports two-stage conversion workflow:
 * 1. "preview": Runs detection and cutout generation in memory, returning
 *    base64 previews without writing any files to disk.
 * 2. "save": Takes approved template recipe and cutout image, commits
 *    the PNG to public/frames/ and appends/updates data/templates.json.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  detectPlaceholders,
  generateCutoutBuffer,
  buildTemplateRecipe,
  saveFrameAndTemplate,
  DEFAULT_OPTIONS,
} from "@/lib/frame-converter";
import type { Category, Template } from "@/types/template";
import { CATEGORIES } from "@/types/template";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Handle "save" action (sent as JSON with approved template recipe and cutout)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { templateJson, cutoutBase64 } = body as {
        templateJson: Template;
        cutoutBase64: string;
      };

      if (!templateJson || !templateJson.id) {
        return NextResponse.json(
          { success: false, error: "Missing required templateJson data" },
          { status: 400 }
        );
      }

      if (!cutoutBase64) {
        return NextResponse.json(
          { success: false, error: "Missing cutoutBase64 image data" },
          { status: 400 }
        );
      }

      // Convert base64 data URL to binary buffer
      const base64Clean = cutoutBase64.replace(/^data:image\/\w+;base64,/, "");
      const cutoutBuffer = Buffer.from(base64Clean, "base64");

      const { cutoutPath, template } = await saveFrameAndTemplate({
        template: templateJson,
        cutoutBuffer,
      });

      return NextResponse.json({
        success: true,
        templateId: template.id,
        cutoutPath,
        message: `Template '${template.id}' saved successfully to library!`,
      });
    }

    // Handle "preview" action (sent as multipart/form-data with uploaded image file)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No image file provided" },
          { status: 400 }
        );
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());

      // Parse metadata form fields
      const rawCategory = (formData.get("category") as string) || "Minimal";
      const category: Category = CATEGORIES.includes(rawCategory as Category)
        ? (rawCategory as Category)
        : "Minimal";

      const name = (formData.get("name") as string) || "Custom Aesthetic Frame";
      const id =
        (formData.get("id") as string) ||
        `frame-${category.toLowerCase()}-${Date.now().toString(36)}`;
      const description =
        (formData.get("description") as string) ||
        "Custom story frame template with dynamic photo placeholders.";

      // Parse advanced detection options
      const maxColorVariance = formData.get("maxColorVariance")
        ? parseInt(formData.get("maxColorVariance") as string, 10)
        : DEFAULT_OPTIONS.maxColorVariance;

      const minWidth = formData.get("minWidth")
        ? parseInt(formData.get("minWidth") as string, 10)
        : DEFAULT_OPTIONS.minWidth;

      const minHeight = formData.get("minHeight")
        ? parseInt(formData.get("minHeight") as string, 10)
        : DEFAULT_OPTIONS.minHeight;

      const contrastThreshold = formData.get("contrastThreshold")
        ? parseInt(formData.get("contrastThreshold") as string, 10)
        : DEFAULT_OPTIONS.contrastThreshold;

      const detectPlusIcon = formData.get("detectPlusIcon") !== "false";

      // Check if client provided custom/manually edited slots
      const rawManualSlots = formData.get("manualSlots") as string | null;
      let detectedPlaceholders: any[] = [];
      let dimensions = { width: 1080, height: 1920 };
      let originalDimensions = { width: 1080, height: 1920 };
      let resizedOriginalBase64 = "";

      if (rawManualSlots) {
        try {
          detectedPlaceholders = JSON.parse(rawManualSlots);
        } catch {
          detectedPlaceholders = [];
        }
      }

      // If no manual slots were sent, run dual-mode automatic detection
      if (detectedPlaceholders.length === 0) {
        const detection = await detectPlaceholders(fileBuffer, {
          maxColorVariance,
          minWidth,
          minHeight,
          contrastThreshold,
          detectPlusIcon,
        });
        detectedPlaceholders = detection.placeholders;
        dimensions = detection.dimensions;
        originalDimensions = detection.originalDimensions;
        resizedOriginalBase64 = detection.resizedOriginalBase64;
      } else {
        const detection = await detectPlaceholders(fileBuffer, {
          maxColorVariance,
          minWidth,
          minHeight,
          contrastThreshold,
          detectPlusIcon: false,
        });
        dimensions = detection.dimensions;
        originalDimensions = detection.originalDimensions;
        resizedOriginalBase64 = detection.resizedOriginalBase64;
      }

      // 2. Generate transparent cutout PNG buffer (in-memory)
      const cutout = await generateCutoutBuffer(fileBuffer, detectedPlaceholders, {
        maxColorVariance,
        minWidth,
        minHeight,
        contrastThreshold,
      });

      // 3. Construct template JSON structure
      const templateJson = buildTemplateRecipe(
        {
          id,
          name,
          category,
          description,
          publicCutoutUrl: `/frames/${id}-frame.png`,
        },
        detectedPlaceholders
      );

      return NextResponse.json({
        success: true,
        placeholders: detectedPlaceholders,
        dimensions,
        originalDimensions,
        resizedOriginalBase64,
        cutoutBase64: cutout.base64,
        templateJson,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported Content-Type" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API convert-frame] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process frame conversion" },
      { status: 500 }
    );
  }
}
