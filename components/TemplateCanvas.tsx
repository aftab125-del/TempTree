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
                editable: false,
                selectable: false,
                evented: false,
                hasControls: false,
                hasBorders: false,
              });

              (textObj as any).elementId = el.id;
              (textObj as any).elementType = "text";
              if (textObj && typeof textObj.render === "function") {
                canvasInstance.add(textObj);
                resolve(textObj);
              } else {
                resolve(null);
              }
            } else if (el.type === "image") {
              if (el.id === "frame-cutout-overlay") {
                // Set decorative cutout frame directly as canvas overlayImage
                // Fabric's _renderOverlay renders on top of all photo slots and active selections
                fabric.Image.fromURL(
                  el.src,
                  (overlayImg: any, isError: boolean) => {
                    if (!overlayImg || isError || !canvasInstance) {
                      resolve(null);
                      return;
                    }
                    const scaleX = nativeWidth / (overlayImg.width || nativeWidth);
                    const scaleY = nativeHeight / (overlayImg.height || nativeHeight);
                    overlayImg.set({
                      left: 0,
                      top: 0,
                      originX: "left",
                      originY: "top",
                      scaleX: scaleX,
                      scaleY: scaleY,
                      selectable: false,
                      evented: false,
                      hasControls: false,
                      hasBorders: false,
                      hoverCursor: "default",
                    });
                    (overlayImg as any).elementId = el.id;
                    (overlayImg as any).elementType = "image";
                    (overlayImg as any).isOverlay = true;

                    canvasInstance.setOverlayImage(overlayImg, () => {
                      if (canvasInstance && typeof canvasInstance.renderAll === "function") {
                        canvasInstance.renderAll();
                      }
                      resolve(overlayImg);
                    });
                  },
                  { crossOrigin: "anonymous" }
                );
              } else {
                // Load image placeholder or user photo with bleed margin behind cutout
                fabric.Image.fromURL(
                  el.src,
                  (img: any, isError: boolean) => {
                    if (!img || isError || typeof img.render !== "function" || !canvasInstance) {
                      resolve(null);
                      return;
                    }

                    const bleed = 4;
                    const baseW = el.width || 720;
                    const baseH = el.height || 880;
                    const targetWidth = baseW + bleed * 2;
                    const targetHeight = baseH + bleed * 2;
                    const targetLeft = (el.left || 0) - bleed;
                    const targetTop = (el.top || 0) - bleed;

                    // Scale image to fit the container bounds with cover fit
                    const scaleX = targetWidth / (img.width || 1);
                    const scaleY = targetHeight / (img.height || 1);
                    const coverScale = Math.max(scaleX, scaleY);

                    const renderedW = (img.width || 1) * coverScale;
                    const renderedH = (img.height || 1) * coverScale;
                    const centerOffsetX = (targetWidth - renderedW) / 2;
                    const centerOffsetY = (targetHeight - renderedH) / 2;

                    img.set({
                      left: targetLeft + centerOffsetX,
                      top: targetTop + centerOffsetY,
                      scaleX: coverScale,
                      scaleY: coverScale,
                      opacity: el.opacity ?? 1,
                      angle: el.angle || 0,
                      selectable: interactive,
                      evented: interactive,
                      hasControls: false, // Prevents distorting circular drag handles
                      hasBorders: true,   // Subtle selection outline
                      borderColor: "#E2B4BD",
                      borderScaleFactor: 2,
                      lockMovementX: true, // Photo stays locked in slot
                      lockMovementY: true,
                      lockRotation: true,
                      lockScalingX: true,
                      lockScalingY: true,
                      hoverCursor: interactive ? "pointer" : "default",
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
                    (img as any).targetWidth = baseW;
                    (img as any).targetHeight = baseH;
                    (img as any).aspectRatio = baseW / baseH;
                    (img as any).originalLeft = el.left;
                    (img as any).originalTop = el.top;

                    canvasInstance.add(img);
                    resolve(img);
                  },
                  { crossOrigin: "anonymous" }
                );
              }
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
              if (rectObj && typeof rectObj.render === "function") {
                canvasInstance.add(rectObj);
                resolve(rectObj);
              } else {
                resolve(null);
              }
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
              if (circleObj && typeof circleObj.render === "function") {
                canvasInstance.add(circleObj);
                resolve(circleObj);
              } else {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          });
        });

        await Promise.all(elementPromises);

        // Fallback for non-overlay templates: ensure any overlay element stays above photos
        const canvasObjects = canvasInstance.getObjects();
        const fallbackOverlay = canvasObjects.find(
          (obj: any) => obj.elementId === "frame-cutout-overlay"
        );
        if (fallbackOverlay && typeof canvasInstance.bringToFront === "function") {
          canvasInstance.bringToFront(fallbackOverlay);
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
