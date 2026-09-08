"use client";

import React, { useEffect, useRef, useState } from "react";
import { LayoutJson, TemplateElement } from "@/types/template";
import { Loader2 } from "lucide-react";

interface TemplateCanvasProps {
  layout: LayoutJson;
  interactive?: boolean;
  scale?: number; // Zoom/scaling multiplier relative to 1080x1920
  onCanvasReady?: (fabricCanvas: any) => void;
  onSelectionChange?: (selectedObject: any | null) => void;
  className?: string;
}

/**
 * TemplateCanvas Component
 * -------------------------------------------------------------
 * Powers both the high-fidelity gallery preview renders and the full-featured
 * in-browser Instagram Story editor (1080x1920 logical canvas).
 *
 * Uses Fabric.js for canvas rendering, element transformation, text editing,
 * layer ordering, and high-res PNG export.
 */
export default function TemplateCanvas({
  layout,
  interactive = false,
  scale = 0.25,
  onCanvasReady,
  onSelectionChange,
  className = "",
}: TemplateCanvasProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let canvasInstance: any = null;

    const initCanvas = async () => {
      try {
        // Dynamically import Fabric to ensure SSR compatibility
        const { fabric } = await import("fabric");

        if (!canvasElRef.current || !isMounted) return;

        // Dispose existing instance if present
        if (fabricRef.current) {
          fabricRef.current.dispose();
          fabricRef.current = null;
        }

        const nativeWidth = layout.width || 1080;
        const nativeHeight = layout.height || 1920;

        const displayWidth = nativeWidth * scale;
        const displayHeight = nativeHeight * scale;

        canvasInstance = new fabric.Canvas(canvasElRef.current, {
          width: displayWidth,
          height: displayHeight,
          backgroundColor: layout.backgroundColor || "#4A4A4A",
          selection: interactive,
          preserveObjectStacking: true,
          renderOnAddRemove: true,
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
          canvasInstance.setBackgroundColor(gradient, canvasInstance.renderAll.bind(canvasInstance));
        }

        // Render all elements onto canvas
        const elementPromises = layout.elements.map((el: TemplateElement) => {
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
                editable: interactive,
                selectable: interactive,
                hasControls: interactive,
                hasBorders: interactive,
                cornerColor: "#E2B4BD",
                cornerStyle: "circle",
                cornerSize: 24,
                transparentCorners: false,
                borderColor: "#F7D6D0",
                padding: 12,
              });

              // Custom identifier for editor properties
              (textObj as any).elementId = el.id;
              (textObj as any).elementType = "text";
              canvasInstance.add(textObj);
              resolve(textObj);
            } else if (el.type === "image") {
              // Load image placeholder or user photo
              fabric.Image.fromURL(
                el.src,
                (img: any) => {
                  if (!img) {
                    resolve(null);
                    return;
                  }

                  const targetWidth = el.width || 720;
                  const targetHeight = el.height || 880;

                  // Scale image to fit the container bounds
                  const scaleX = targetWidth / (img.width || 1);
                  const scaleY = targetHeight / (img.height || 1);
                  const maxScale = Math.max(scaleX, scaleY);

                  img.set({
                    left: el.left,
                    top: el.top,
                    scaleX: maxScale,
                    scaleY: maxScale,
                    opacity: el.opacity ?? 1,
                    angle: el.angle || 0,
                    selectable: interactive,
                    hasControls: interactive,
                    hasBorders: interactive,
                    cornerColor: "#E2B4BD",
                    cornerStyle: "circle",
                    cornerSize: 24,
                    transparentCorners: false,
                    borderColor: "#F7D6D0",
                  });

                  if (el.stroke) {
                    img.set({
                      stroke: el.stroke,
                      strokeWidth: el.strokeWidth || 2,
                    });
                  }

                  (img as any).elementId = el.id;
                  (img as any).elementType = "image";
                  (img as any).placeholderLabel = el.placeholderLabel;
                  (img as any).isPlaceholder = el.isPlaceholder;

                  canvasInstance.add(img);
                  resolve(img);
                },
                { crossOrigin: "anonymous" }
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
              canvasInstance.add(rectObj);
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
              canvasInstance.add(circleObj);
              resolve(circleObj);
            } else {
              resolve(null);
            }
          });
        });

        await Promise.all(elementPromises);

        canvasInstance.renderAll();

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
        }

        fabricRef.current = canvasInstance;
        if (isMounted) {
          setIsLoading(false);
          onCanvasReady?.(canvasInstance);
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
    };
  }, [layout, interactive, scale]);

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
      <canvas ref={canvasElRef} />
    </div>
  );
}
