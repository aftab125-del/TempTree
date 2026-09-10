"use client";

import React, { useEffect, useRef, useState } from "react";
import { LayoutJson, TemplateElement } from "@/types/template";
import { loadFabric } from "@/lib/fabric";
import { Loader2 } from "lucide-react";

interface TemplateCanvasProps {
  layout: LayoutJson;
  interactive?: boolean;
  scale?: number; // Zoom/scaling multiplier relative to 1080x1920
  onCanvasReady?: (fabricCanvas: any, fabricInstance?: any) => void;
  onSelectionChange?: (selectedObject: any | null) => void;
  className?: string;
}

/**
 * TemplateCanvas Component
 * -------------------------------------------------------------
 * Powers both the high-fidelity gallery preview renders and the full-featured
 * in-browser Instagram Story editor (1080x1920 logical canvas).
 *
 * Uses the shared Fabric.js singleton (via @/lib/fabric) to guarantee that only
 * one Fabric module instance is ever imported and shared across the entire app.
 */
export default function TemplateCanvas({
  layout,
  interactive = false,
  scale = 0.25,
  onCanvasReady,
  onSelectionChange,
  className = "",
}: TemplateCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let canvasInstance: any = null;

    const initCanvas = async () => {
      try {
        setIsLoading(true);
        // Dynamically retrieve the shared Fabric.js client-side singleton
        const fabric = await loadFabric();

        if (!fabric || !containerRef.current || !isMounted) return;

        // Dispose existing instance if present
        if (fabricRef.current) {
          try {
            fabricRef.current.dispose();
          } catch (e) {
            // cleanup
          }
          fabricRef.current = null;
        }

        // Wipe any stale Fabric canvas wrappers from DOM
        containerRef.current.innerHTML = "";

        const nativeWidth = layout.width || 1080;
        const nativeHeight = layout.height || 1920;

        const displayWidth = nativeWidth * scale;
        const displayHeight = nativeHeight * scale;

        const canvasEl = document.createElement("canvas");
        containerRef.current.appendChild(canvasEl);

        canvasInstance = new fabric.Canvas(canvasEl, {
          width: displayWidth,
          height: displayHeight,
          backgroundColor: layout.backgroundColor || "#4A4A4A",
          selection: false,
          preserveObjectStacking: true,
          renderOnAddRemove: true,
          controlsAboveOverlay: false,
        });

        // Set zoom so internal coordinate space remains 1080x1920
        canvasInstance.setZoom(scale);

        // Render Background Gradient if specified
        if (layout.backgroundGradient) {
          const grad = layout.backgroundGradient;
          const gradient = new fabric.Gradient({
            type: grad.type || "linear",
            gradientUnits: "percentage",
            coords: {
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 1,
            },
            colorStops: grad.colors.map((c) => ({
              offset: c.offset,
              color: c.color,
            })),
          });
          canvasInstance.setBackgroundColor(gradient, () => {
            if (canvasInstance && typeof canvasInstance.renderAll === "function") {
              canvasInstance.renderAll();
            }
          });
        }

        // Separate base elements from the decorative frame cutout overlay
        const baseElements = layout.elements.filter((el) => el.id !== "frame-cutout-overlay");
        const overlayElement = layout.elements.find((el) => el.id === "frame-cutout-overlay");

        // 1. Render all base elements (shapes, text, and photo slots) first
        const basePromises = baseElements.map((el: TemplateElement) => {
          return new Promise<any>((resolve) => {
            if (el.type === "text") {
              const textObj = new fabric.Textbox(el.text, {
                left: el.left,
                top: el.top,
                originX: el.textAlign === "center" ? "center" : "left",
                originY: "top",
                fontFamily: el.fontFamily === "Playfair Display" ? "Playfair Display, serif" : "Poppins, sans-serif",
                fontSize: el.fontSize,
                fontWeight: el.fontWeight || "normal",
                fontStyle: el.fontStyle || "normal",
                fill: el.fill,
                textAlign: el.textAlign || "left",
                width: el.width || 700,
                opacity: el.opacity ?? 1,
                angle: el.angle || 0,
                editable: false,
                selectable: false,
                evented: false,
                hasControls: false,
                hasBorders: false,
              });

              (textObj as any).elementId = el.id;
              (textObj as any).elementType = "text";
              resolve(textObj);
            } else if (el.type === "image") {
              fabric.Image.fromURL(
                el.src,
                (img: any, isError: boolean) => {
                  if (!img || isError || !canvasInstance) {
                    resolve(null);
                    return;
                  }

                  const slotW = el.width || 720;
                  const slotH = el.height || 880;
                  const imgW = img.width || 1;
                  const imgH = img.height || 1;
                  const slotAngle = (el as any).rotation ?? el.angle ?? 0;

                  const slotCenterX = (el as any).cx != null
                    ? (el as any).cx
                    : (el.left || 0) + slotW / 2;
                  const slotCenterY = (el as any).cy != null
                    ? (el as any).cy
                    : (el.top || 0) + slotH / 2;

                  // Automatically scale to COVER the full slot dimensions
                  const coverScale = Math.max(slotW / imgW, slotH / imgH);

                  // Clip path tied to slot dimensions and rotation so movement never bleeds outside
                  const clipRect = new fabric.Rect({
                    left: slotCenterX,
                    top: slotCenterY,
                    width: slotW,
                    height: slotH,
                    originX: "center",
                    originY: "center",
                    angle: slotAngle,
                    absolutePositioned: true,
                  });

                  img.set({
                    left: slotCenterX,
                    top: slotCenterY,
                    originX: "center",
                    originY: "center",
                    scaleX: coverScale,
                    scaleY: coverScale,
                    angle: slotAngle,
                    clipPath: clipRect,
                    opacity: el.opacity ?? 1,
                    selectable: interactive,
                    evented: interactive,
                    hasControls: false,
                    hasBorders: true,
                    borderColor: "#E2B4BD",
                    borderScaleFactor: 2,
                    lockMovementX: !interactive, // allow dragging within slot in editor
                    lockMovementY: !interactive,
                    lockRotation: true,
                    lockScalingX: true,
                    lockScalingY: true,
                    hoverCursor: interactive ? "grab" : "default",
                    moveCursor: "grabbing",
                  });

                  (img as any).elementId = el.id;
                  (img as any).elementType = "image";
                  (img as any).placeholderLabel = el.placeholderLabel;
                  (img as any).isPlaceholder = el.isPlaceholder;
                  (img as any).targetWidth = slotW;
                  (img as any).targetHeight = slotH;
                  (img as any).aspectRatio = slotW / slotH;
                  (img as any).slotCenterX = slotCenterX;
                  (img as any).slotCenterY = slotCenterY;
                  (img as any).slotAngle = slotAngle;
                  (img as any).slotWidth = slotW;
                  (img as any).slotHeight = slotH;
                  (img as any).slotLeft = el.left || 0;
                  (img as any).slotTop = el.top || 0;

                  resolve(img);
                },
                { crossOrigin: el.src.startsWith("http") ? "anonymous" : undefined }
              );
            } else if (el.type === "rect") {
              const rectObj = new fabric.Rect({
                left: el.left,
                top: el.top,
                width: el.width || 200,
                height: el.height || 200,
                fill: el.fill,
                stroke: el.stroke,
                strokeWidth: el.strokeWidth || 0,
                rx: el.rx || 0,
                ry: el.ry || 0,
                opacity: el.opacity ?? 1,
                angle: el.angle || 0,
                selectable: interactive,
                hasControls: interactive,
                cornerColor: "#E2B4BD",
                cornerStyle: "circle",
                cornerSize: 24,
                transparentCorners: false,
                borderColor: "#F7D6D0",
              });

              (rectObj as any).elementId = el.id;
              (rectObj as any).elementType = "rect";
              resolve(rectObj);
            } else if (el.type === "circle") {
              const circleObj = new fabric.Circle({
                left: el.left,
                top: el.top,
                originX: "center",
                originY: "center",
                radius: el.radius || 100,
                fill: el.fill,
                stroke: el.stroke,
                strokeWidth: el.strokeWidth || 0,
                opacity: el.opacity ?? 1,
                angle: el.angle || 0,
                selectable: interactive,
                hasControls: interactive,
                cornerColor: "#E2B4BD",
                cornerStyle: "circle",
                cornerSize: 24,
                transparentCorners: false,
                borderColor: "#F7D6D0",
              });

              (circleObj as any).elementId = el.id;
              (circleObj as any).elementType = "circle";
              resolve(circleObj);
            } else {
              resolve(null);
            }
          });
        });

        // Await all base objects and add them to canvas in order
        const baseObjects = await Promise.all(basePromises);
        baseObjects.forEach((obj) => {
          if (obj && canvasInstance) {
            canvasInstance.add(obj);
          }
        });

        // 2. Add frame overlay AFTER (on top of) the photo objects
        if (overlayElement && overlayElement.type === "image") {
          await new Promise<void>((resolveOverlay) => {
            fabric.Image.fromURL(
              overlayElement.src,
              (overlayImg: any, isError: boolean) => {
                if (!overlayImg || isError || !canvasInstance) {
                  resolveOverlay();
                  return;
                }

                const scaleX = nativeWidth / (overlayImg.width || nativeWidth);
                const scaleY = nativeHeight / (overlayImg.height || nativeHeight);

                overlayImg.set({
                  left: overlayElement.left || 0,
                  top: overlayElement.top || 0,
                  originX: "left",
                  originY: "top",
                  scaleX: scaleX,
                  scaleY: scaleY,
                  selectable: false, // does not block interaction with photo underneath
                  evented: false,    // transparent regions click through to photos
                  hasControls: false,
                  hasBorders: false,
                  hoverCursor: "default",
                });

                (overlayImg as any).elementId = "frame-cutout-overlay";
                (overlayImg as any).isOverlay = true;

                // Add to canvas AFTER photos and bring to front
                canvasInstance.add(overlayImg);
                canvasInstance.bringToFront(overlayImg);
                resolveOverlay();
              },
              { crossOrigin: overlayElement.src.startsWith("http") ? "anonymous" : undefined }
            );
          });
        }

        // 3. Ensure drag repositioning is constrained to slot bounds so photo never leaves empty gaps
        if (interactive) {
          canvasInstance.on("object:moving", (e: any) => {
            const target = e.target;
            if (!target || !target.elementId || target.elementId === "frame-cutout-overlay" || target.elementId === "slot-adjuster-rect") return;

            const slotW = target.slotWidth ?? target.targetWidth;
            const slotH = target.slotHeight ?? target.targetHeight;
            if (slotW == null || slotH == null) return;

            const slotCx = target.slotCenterX ?? (target.slotLeft != null ? target.slotLeft + slotW / 2 : target.left);
            const slotCy = target.slotCenterY ?? (target.slotTop != null ? target.slotTop + slotH / 2 : target.top);
            const slotAngle = target.slotAngle != null ? target.slotAngle : (target.clipPath?.angle ?? 0);

            const scaledW = target.getScaledWidth();
            const scaledH = target.getScaledHeight();

            const maxDispX = Math.max(0, (scaledW - slotW) / 2);
            const maxDispY = Math.max(0, (scaledH - slotH) / 2);

            if (target.originX === "center" && target.originY === "center") {
              const dx = target.left - slotCx;
              const dy = target.top - slotCy;

              if (Math.abs(slotAngle) > 0.5) {
                const rad = (slotAngle * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                // Project displacement into local slot coordinate axes
                let du = dx * cos + dy * sin;
                let dv = -dx * sin + dy * cos;

                // Clamp to allowed displacement
                du = Math.max(-maxDispX, Math.min(maxDispX, du));
                dv = Math.max(-maxDispY, Math.min(maxDispY, dv));

                // Re-project back to canvas coordinates
                target.left = slotCx + du * cos - dv * sin;
                target.top = slotCy + du * sin + dv * cos;
              } else {
                const clampedDx = Math.max(-maxDispX, Math.min(maxDispX, dx));
                const clampedDy = Math.max(-maxDispY, Math.min(maxDispY, dy));
                target.left = slotCx + clampedDx;
                target.top = slotCy + clampedDy;
              }
            } else {
              // Fallback for top-left origin objects
              const slotLeft = target.slotLeft ?? (slotCx - slotW / 2);
              const slotTop = target.slotTop ?? (slotCy - slotH / 2);

              if (scaledW >= slotW) {
                const minLeft = slotLeft + slotW - scaledW;
                const maxLeft = slotLeft;
                if (target.left > maxLeft) target.left = maxLeft;
                if (target.left < minLeft) target.left = minLeft;
              } else {
                target.left = slotLeft + (slotW - scaledW) / 2;
              }

              if (scaledH >= slotH) {
                const minTop = slotTop + slotH - scaledH;
                const maxTop = slotTop;
                if (target.top > maxTop) target.top = maxTop;
                if (target.top < minTop) target.top = minTop;
              } else {
                target.top = slotTop + (slotH - scaledH) / 2;
              }
            }
            target.setCoords();
          });
        }

        if (canvasInstance && typeof canvasInstance.renderAll === "function") {
          canvasInstance.renderAll();
        }

        // Selection listeners for editor mode
        if (interactive) {
          canvasInstance.on("selection:created", (e: any) => {
            onSelectionChange?.(e.selected ? e.selected[0] : null);
          });
          canvasInstance.on("selection:updated", (e: any) => {
            onSelectionChange?.(e.selected ? e.selected[0] : null);
          });
          canvasInstance.on("selection:cleared", () => {
            onSelectionChange?.(null);
          });
          canvasInstance.on("text:changed", (e: any) => {
            onSelectionChange?.(e.target);
          });
        }

        fabricRef.current = canvasInstance;
        if (isMounted) {
          setIsLoading(false);
          onCanvasReady?.(canvasInstance, fabric);
        }
      } catch (err) {
        console.error("Failed to initialize Fabric canvas:", err);
      }
    };

    initCanvas();

    return () => {
      isMounted = false;
      if (fabricRef.current) {
        try {
          fabricRef.current.dispose();
        } catch (e) {
          // cleanup
        }
        fabricRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [layout, interactive]);

  // Handle responsive zoom and scale changes smoothly in-place without re-creating canvas
  useEffect(() => {
    if (!fabricRef.current) return;
    const nativeWidth = layout.width || 1080;
    const nativeHeight = layout.height || 1920;

    const displayWidth = nativeWidth * scale;
    const displayHeight = nativeHeight * scale;

    fabricRef.current.setDimensions({
      width: displayWidth,
      height: displayHeight,
    });
    fabricRef.current.setZoom(scale);
    if (typeof fabricRef.current.renderAll === "function") {
      fabricRef.current.renderAll();
    }
  }, [scale, layout.width, layout.height]);

  return (
    <div
      className={`relative inline-block overflow-hidden shadow-2xl rounded-2xl bg-plum ${className}`}
      style={{
        width: 1080 * scale,
        height: 1920 * scale,
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-plum/90 z-10 text-cream">
          <Loader2 className="w-8 h-8 animate-spin text-dustyPink" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
