"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { LayoutJson, TemplateElement } from "@/types/template";
import { loadFabric } from "@/lib/fabric";
import { Loader2 } from "lucide-react";

interface TemplateCanvasProps {
  layout: LayoutJson;
  templateId?: string;
  interactive?: boolean;
  scale?: number; // Zoom/scaling multiplier relative to 1080x1920
  onCanvasReady?: (fabricCanvas: any, fabricInstance?: any) => void;
  onSelectionChange?: (selectedObject: any | null) => void;
  onSlotSelect?: (slotId: string) => void;
  onPhotoDrop?: (slotId: string, file: File) => void;
  selectedSlotId?: string | null;
  snapGuides?: { x?: number; y?: number } | null;
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
  templateId,
  interactive = false,
  scale = 0.25,
  onCanvasReady,
  onSelectionChange,
  onSlotSelect,
  onPhotoDrop,
  selectedSlotId,
  snapGuides,
  className = "",
}: TemplateCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<any>(null);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const [isLoading, setIsLoading] = useState(true);
  const [draggedOverSlotId, setDraggedOverSlotId] = useState<string | null>(null);

  // Derive photo slots list for canvas badge overlays
  const photoSlotsList = useMemo(() => {
    return layout.elements
      .filter((el) => el.type === "image" && el.id !== "frame-cutout-overlay")
      .map((el, idx) => {
        const imgEl = el as any;
        const w = imgEl.width || 600;
        const h = imgEl.height || 600;
        const rot = imgEl.rotation ?? imgEl.angle ?? 0;
        const cx = imgEl.cx != null ? imgEl.cx : (imgEl.left || 0) + w / 2;
        const cy = imgEl.cy != null ? imgEl.cy : (imgEl.top || 0) + h / 2;
        return {
          id: imgEl.id,
          index: idx + 1,
          label: imgEl.placeholderLabel || `Photo #${idx + 1}`,
          width: w,
          height: h,
          cx,
          cy,
          rotation: rot,
        };
      });
  }, [layout]);

  // Key by template ID to prevent destroying the live interactive canvas on state updates
  const templateKey =
    templateId ||
    (layout as any)?.id ||
    (layout?.elements?.[0]?.id ? `layout-${layout.elements[0].id}` : "template-canvas");

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

        const currentScale = scaleRef.current ?? scale;
        const displayWidth = nativeWidth * currentScale;
        const displayHeight = nativeHeight * currentScale;

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
        canvasInstance.setZoom(currentScale);

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
                  const slotCornerRadius = (el as any).cornerRadius ?? (el as any).rx ?? 0;

                  const slotCenterX = (el as any).cx != null
                    ? (el as any).cx
                    : (el.left || 0) + slotW / 2;
                  const slotCenterY = (el as any).cy != null
                    ? (el as any).cy
                    : (el.top || 0) + slotH / 2;

                  // Automatically scale to COVER the full slot dimensions
                  const coverScale = Math.max(slotW / imgW, slotH / imgH);

                  // Clip path tied to slot dimensions, rotation and corner radius so movement never bleeds outside
                  const clipRect = new fabric.Rect({
                    left: slotCenterX,
                    top: slotCenterY,
                    width: slotW,
                    height: slotH,
                    originX: "center",
                    originY: "center",
                    angle: slotAngle,
                    rx: slotCornerRadius,
                    ry: slotCornerRadius,
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

        // Selection & interaction listeners for editor mode
        if (interactive) {
          // Direct in-slot photo zooming with mouse wheel (bounded to prevent empty borders)
          canvasInstance.on("mouse:wheel", (opt: any) => {
            const active = canvasInstance.getActiveObject();
            if (
              !active ||
              !active.elementId ||
              active.elementId === "frame-cutout-overlay" ||
              active.elementId === "slot-adjuster-rect"
            ) {
              return;
            }

            const pointer = canvasInstance.getPointer(opt.e);
            const slotW = active.slotWidth ?? active.targetWidth ?? 600;
            const slotH = active.slotHeight ?? active.targetHeight ?? 600;
            const slotCx =
              active.slotCenterX ??
              (active.slotLeft != null ? active.slotLeft + slotW / 2 : active.left);
            const slotCy =
              active.slotCenterY ??
              (active.slotTop != null ? active.slotTop + slotH / 2 : active.top);
            const slotAngle =
              active.slotAngle != null ? active.slotAngle : (active.clipPath?.angle ?? 0);

            // Test if cursor is inside the slot
            const dx = pointer.x - slotCx;
            const dy = pointer.y - slotCy;
            const rad = (-slotAngle * Math.PI) / 180;
            const u = dx * Math.cos(rad) - dy * Math.sin(rad);
            const v = dx * Math.sin(rad) + dy * Math.cos(rad);

            if (Math.abs(u) <= slotW / 2 && Math.abs(v) <= slotH / 2) {
              opt.e.preventDefault();
              opt.e.stopPropagation();

              const imgW = active.width || 1;
              const imgH = active.height || 1;
              const minScale = Math.max(slotW / imgW, slotH / imgH);
              const maxScale = minScale * 4.5;

              const zoomDelta = opt.e.deltaY < 0 ? 1.06 : 0.94;
              const currentScale = active.scaleX || minScale;
              const targetScale = Math.max(minScale, Math.min(maxScale, currentScale * zoomDelta));

              active.set({
                scaleX: targetScale,
                scaleY: targetScale,
              });

              // Re-clamp displacement so zoom never reveals unpainted borders
              const scaledW = targetScale * imgW;
              const scaledH = targetScale * imgH;
              const maxDispX = Math.max(0, (scaledW - slotW) / 2);
              const maxDispY = Math.max(0, (scaledH - slotH) / 2);

              const currDx = active.left - slotCx;
              const currDy = active.top - slotCy;
              if (Math.abs(slotAngle) > 0.5) {
                const sRad = (slotAngle * Math.PI) / 180;
                const sCos = Math.cos(sRad);
                const sSin = Math.sin(sRad);
                let localU = currDx * sCos + currDy * sSin;
                let localV = -currDx * sSin + currDy * sCos;
                localU = Math.max(-maxDispX, Math.min(maxDispX, localU));
                localV = Math.max(-maxDispY, Math.min(maxDispY, localV));
                active.left = slotCx + localU * sCos - localV * sSin;
                active.top = slotCy + localU * sSin + localV * sCos;
              } else {
                active.left = slotCx + Math.max(-maxDispX, Math.min(maxDispX, currDx));
                active.top = slotCy + Math.max(-maxDispY, Math.min(maxDispY, currDy));
              }

              active.setCoords();
              canvasInstance.renderAll();
            }
          });

          // Visual hover outline on unselected slots
          canvasInstance.on("mouse:over", (e: any) => {
            const target = e.target;
            if (!target || !target.elementId || target.elementId === "frame-cutout-overlay" || target.elementId === "slot-adjuster-rect") return;
            const active = canvasInstance.getActiveObject();
            if (active !== target) {
              target.set({
                borderColor: "#F7D6D0",
                borderDashArray: [6, 4],
                hasBorders: true,
              });
              canvasInstance.renderAll();
            }
          });

          canvasInstance.on("mouse:out", (e: any) => {
            const target = e.target;
            if (!target || !target.elementId || target.elementId === "frame-cutout-overlay" || target.elementId === "slot-adjuster-rect") return;
            const active = canvasInstance.getActiveObject();
            if (active !== target) {
              target.set({
                borderColor: "#E2B4BD",
                borderDashArray: null,
                hasBorders: false,
              });
              canvasInstance.renderAll();
            }
          });

          canvasInstance.on("selection:created", (e: any) => {
            const obj = e.selected ? e.selected[0] : null;
            onSelectionChange?.(obj);
            if (obj?.elementId && obj.elementId !== "frame-cutout-overlay" && obj.elementId !== "slot-adjuster-rect") {
              obj.set({ hasBorders: true, borderColor: "#F7D6D0", borderDashArray: null });
              onSlotSelect?.(obj.elementId);
            }
          });
          canvasInstance.on("selection:updated", (e: any) => {
            const obj = e.selected ? e.selected[0] : null;
            onSelectionChange?.(obj);
            if (obj?.elementId && obj.elementId !== "frame-cutout-overlay" && obj.elementId !== "slot-adjuster-rect") {
              obj.set({ hasBorders: true, borderColor: "#F7D6D0", borderDashArray: null });
              onSlotSelect?.(obj.elementId);
            }
          });
          canvasInstance.on("selection:cleared", () => {
            onSelectionChange?.(null);
          });
          canvasInstance.on("text:changed", (e: any) => {
            onSelectionChange?.(e.target);
          });
        }

        fabricRef.current = canvasInstance;
        if (scaleRef.current && scaleRef.current !== currentScale) {
          canvasInstance.setDimensions({
            width: nativeWidth * scaleRef.current,
            height: nativeHeight * scaleRef.current,
          });
          canvasInstance.setZoom(scaleRef.current);
          canvasInstance.renderAll();
        }
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
  }, [templateKey, interactive]);

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

  const handleDragOver = (e: React.DragEvent) => {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    let foundSlotId: string | null = null;
    for (const slot of photoSlotsList) {
      const dx = clickX - slot.cx;
      const dy = clickY - slot.cy;
      const rad = (-slot.rotation * Math.PI) / 180;
      const u = dx * Math.cos(rad) - dy * Math.sin(rad);
      const v = dx * Math.sin(rad) + dy * Math.cos(rad);

      if (Math.abs(u) <= slot.width / 2 && Math.abs(v) <= slot.height / 2) {
        foundSlotId = slot.id;
        break;
      }
    }
    setDraggedOverSlotId(foundSlotId);
  };

  const handleDragLeave = () => {
    setDraggedOverSlotId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    const targetSlotId = draggedOverSlotId;
    setDraggedOverSlotId(null);
    if (!targetSlotId) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onPhotoDrop?.(targetSlotId, file);
    }
  };

  return (
    <div
      className={`relative inline-block overflow-hidden shadow-2xl rounded-2xl bg-plum select-none ${className}`}
      style={{
        width: 1080 * scale,
        height: 1920 * scale,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-plum/90 z-30 text-cream">
          <Loader2 className="w-8 h-8 animate-spin text-dustyPink" />
        </div>
      )}

      {/* Magnetic Snapping Guidelines */}
      {interactive && snapGuides?.x != null && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20 border-l-2 border-dashed border-[#F7D6D0] shadow-[0_0_8px_rgba(247,214,208,0.9)]"
          style={{ left: `${snapGuides.x * scale}px` }}
        />
      )}
      {interactive && snapGuides?.y != null && (
        <div
          className="absolute left-0 right-0 pointer-events-none z-20 border-t-2 border-dashed border-[#F7D6D0] shadow-[0_0_8px_rgba(247,214,208,0.9)]"
          style={{ top: `${snapGuides.y * scale}px` }}
        />
      )}

      {/* Drag Over Active Slot Highlight */}
      {draggedOverSlotId && (
        <div className="absolute inset-0 z-20 pointer-events-none bg-emerald-500/10 border-2 border-dashed border-emerald-400 flex items-center justify-center">
          <div className="bg-[#181116]/95 px-4 py-2 rounded-full border border-emerald-400 text-emerald-300 text-xs font-bold tracking-wide shadow-2xl flex items-center gap-2 animate-pulse">
            <span>Drop photo to place in slot</span>
          </div>
        </div>
      )}

      {/* Floating Canvas Slot Badges (Numbered chips on slots) */}
      {interactive &&
        !isLoading &&
        photoSlotsList.map((slot, idx) => {
          const isSelected = selectedSlotId === slot.id;
          const leftPx = (slot.cx - slot.width / 2) * scale;
          const topPx = (slot.cy - slot.height / 2) * scale;
          const slotAngle = slot.rotation || 0;

          return (
            <div
              key={slot.id}
              className="absolute pointer-events-auto z-10"
              style={{
                left: `${leftPx}px`,
                top: `${topPx}px`,
                transform: `rotate(${slotAngle}deg)`,
                transformOrigin: "top left",
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSlotSelect?.(slot.id);
                }}
                className={`group flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider transition-all shadow-md cursor-pointer -translate-x-1 -translate-y-2 active:scale-95 ${
                  isSelected
                    ? "bg-[#F7D6D0] text-[#181116] ring-2 ring-[#FAF7F2] scale-105 shadow-[#F7D6D0]/50"
                    : "bg-[#181116]/85 backdrop-blur-md text-[#FAF7F2]/90 border border-white/20 hover:bg-[#E2B4BD] hover:text-[#181116] hover:scale-105"
                }`}
                title={`Select ${slot.label} (Key ${idx + 1})`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isSelected ? "bg-[#181116] text-[#F7D6D0]" : "bg-white/20 text-white"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="text-[9px] font-sans font-semibold">
                  {slot.label || `Photo ${idx + 1}`}
                </span>
              </button>
            </div>
          );
        })}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
