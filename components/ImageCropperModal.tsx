"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crop,
  Move,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";

export interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  aspectRatio: number; // width / height
  targetWidth?: number;
  targetHeight?: number;
  slotLabel?: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  aspectRatio = 1,
  targetWidth = 600,
  targetHeight = 600,
  slotLabel = "Photo Slot",
  onConfirm,
  onCancel,
}: ImageCropperModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 1,
    height: 1,
  });

  // Mode: "fill" (covers entire slot) or "fit" (entire photo visible, no edges cut off)
  const [cropMode, setCropMode] = useState<"fill" | "fit">("fill");

  // Zoom multiplier (1.0 = base size according to cropMode)
  const [zoom, setZoom] = useState<number>(1);
  // Pan offset in preview container pixels
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isApplying, setIsApplying] = useState(false);

  // Container dimensions in pixels
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 320,
    height: 320,
  });

  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Helper to calculate base image size inside container
  const computeBaseSize = useCallback(
    (cW: number, cH: number, nw: number, nh: number, mode: "fill" | "fit") => {
      const imgRatio = nw / (nh || 1);
      const slotRatio = cW / (cH || 1);

      if (mode === "fill") {
        if (imgRatio > slotRatio) {
          return { width: cH * imgRatio, height: cH };
        } else {
          return { width: cW, height: cW / imgRatio };
        }
      } else {
        // "fit" mode: entire image fits inside container
        if (imgRatio > slotRatio) {
          return { width: cW, height: cW / imgRatio };
        } else {
          return { width: cH * imgRatio, height: cH };
        }
      }
    },
    []
  );

  // Measure container when mounted or resized
  const updateContainerDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    }
  }, []);

  // Reset state and preload image when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setIsApplying(false);

      if (imageSrc) {
        const testImg = new Image();
        testImg.onload = () => {
          const nw = testImg.naturalWidth || 800;
          const nh = testImg.naturalHeight || 800;
          setNaturalSize({ width: nw, height: nh });
          setImageLoaded(true);

          // If portrait photo, gently nudge up so subject's head isn't cut off initially
          const imgRatio = nw / nh;
          if (imgRatio < aspectRatio) {
            setOffset({ x: 0, y: 15 });
          } else {
            setOffset({ x: 0, y: 0 });
          }
        };
        testImg.src = imageSrc;
        if (testImg.complete && testImg.naturalWidth > 0) {
          const nw = testImg.naturalWidth;
          const nh = testImg.naturalHeight;
          setNaturalSize({ width: nw, height: nh });
          setImageLoaded(true);
          const imgRatio = nw / nh;
          if (imgRatio < aspectRatio) {
            setOffset({ x: 0, y: 15 });
          } else {
            setOffset({ x: 0, y: 0 });
          }
        } else {
          setImageLoaded(false);
        }
      } else {
        setImageLoaded(false);
      }
    }
  }, [isOpen, imageSrc, aspectRatio]);

  useEffect(() => {
    if (isOpen) {
      // Allow DOM to layout container
      const timer = setTimeout(updateContainerDimensions, 50);
      window.addEventListener("resize", updateContainerDimensions);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updateContainerDimensions);
      };
    }
  }, [isOpen, updateContainerDimensions]);

  // Handle image element load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({
      width: img.naturalWidth || 800,
      height: img.naturalHeight || 800,
    });
    setImageLoaded(true);
    updateContainerDimensions();
  };

  const isReadyToApply =
    imageLoaded || Boolean(imageRef.current?.complete && (imageRef.current?.naturalWidth || 0) > 0);

  // Helper to format aspect ratio nicely (e.g. "1:1 Square", "4:5 Portrait")
  const formatRatio = (ratio: number) => {
    if (Math.abs(ratio - 1) < 0.05) return "1:1 Square";
    if (Math.abs(ratio - 0.8) < 0.05) return "4:5 Portrait";
    if (Math.abs(ratio - 0.75) < 0.05) return "3:4 Classic";
    if (Math.abs(ratio - 9 / 16) < 0.05) return "9:16 Story";
    if (Math.abs(ratio - 16 / 9) < 0.05) return "16:9 Landscape";
    return `${ratio.toFixed(2)}:1`;
  };

  // Compute current rendered dimensions of image in preview
  const cW = containerDimensions.width;
  const cH = containerDimensions.height;
  const baseSize = computeBaseSize(cW, cH, naturalSize.width, naturalSize.height, cropMode);
  const currentRenderW = baseSize.width * zoom;
  const currentRenderH = baseSize.height * zoom;

  // Clamp offset helper so user cannot drag image away into void
  const clampOffset = useCallback(
    (newX: number, newY: number, renderW: number, renderH: number, contW: number, contH: number, mode: "fill" | "fit") => {
      let clampedX = newX;
      let clampedY = newY;

      if (renderW > contW) {
        const maxX = (renderW - contW) / 2;
        clampedX = Math.max(-maxX, Math.min(maxX, newX));
      } else {
        const maxOvershoot = mode === "fill" ? 0 : (contW - renderW) / 2 + 40;
        clampedX = Math.max(-maxOvershoot, Math.min(maxOvershoot, newX));
      }

      if (renderH > contH) {
        const maxY = (renderH - contH) / 2;
        clampedY = Math.max(-maxY, Math.min(maxY, newY));
      } else {
        const maxOvershoot = mode === "fill" ? 0 : (contH - renderH) / 2 + 40;
        clampedY = Math.max(-maxOvershoot, Math.min(maxOvershoot, newY));
      }

      return { x: clampedX, y: clampedY };
    },
    []
  );

  // --------------------------------------------------------------------------
  // DRAG / PAN HANDLING (Touch and Mouse)
  // --------------------------------------------------------------------------
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setInitialOffset({ ...offset });
  };

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !containerRef.current) return;
      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;

      const rawX = initialOffset.x + deltaX;
      const rawY = initialOffset.y + deltaY;

      const clamped = clampOffset(
        rawX,
        rawY,
        currentRenderW,
        currentRenderH,
        containerDimensions.width,
        containerDimensions.height,
        cropMode
      );

      setOffset(clamped);
    },
    [isDragging, dragStart, initialOffset, currentRenderW, currentRenderH, containerDimensions, cropMode, clampOffset]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse / touch release listeners
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handlePointerMove(e.clientX, e.clientY);
    };
    const onMouseUp = () => {
      if (isDragging) handlePointerUp();
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Mode change handler
  const handleSwitchMode = (newMode: "fill" | "fit") => {
    setCropMode(newMode);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // --------------------------------------------------------------------------
  // EXECUTE CROP & EXPORT
  // --------------------------------------------------------------------------
  const handleApplyCrop = () => {
    if (!imageRef.current || (!imageLoaded && !imageRef.current.complete)) return;
    setIsApplying(true);

    try {
      const img = imageRef.current;
      const nw = img.naturalWidth || naturalSize.width || 800;
      const nh = img.naturalHeight || naturalSize.height || 800;

      // Crisp output resolution (native 1080p scale)
      const exportWidth = Math.max(targetWidth, 1080);
      const exportHeight = Math.round(exportWidth / aspectRatio);

      const canvas = document.createElement("canvas");
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not create canvas 2D context");

      // Scale multiplier between preview container and export canvas
      const scaleMultiplier = exportWidth / Math.max(containerDimensions.width, 1);

      // Render dimensions on export canvas
      const drawW = currentRenderW * scaleMultiplier;
      const drawH = currentRenderH * scaleMultiplier;

      const centerX = (containerDimensions.width / 2 + offset.x) * scaleMultiplier;
      const centerY = (containerDimensions.height / 2 + offset.y) * scaleMultiplier;

      const drawX = centerX - drawW / 2;
      const drawY = centerY - drawH / 2;

      ctx.clearRect(0, 0, exportWidth, exportHeight);

      // If image doesn't fill canvas (Fit mode or zoomed out), render soft matching ambient blur
      if (drawW < exportWidth || drawH < exportHeight || drawX > 0 || drawY > 0) {
        ctx.save();
        ctx.filter = "blur(28px) brightness(0.65)";
        const bgScale = Math.max(exportWidth / nw, exportHeight / nh) * 1.15;
        const bgW = nw * bgScale;
        const bgH = nh * bgScale;
        ctx.drawImage(img, (exportWidth - bgW) / 2, (exportHeight - bgH) / 2, bgW, bgH);
        ctx.restore();
      }

      // Draw crisp user photo
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const croppedDataUrl = canvas.toDataURL("image/png", 0.95);
      onConfirm(croppedDataUrl);
    } catch (err) {
      console.error("Cropping failed:", err);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0a0c]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-[#181116] text-[#FAF7F2] rounded-3xl border border-[#E2B4BD]/30 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E2B4BD]/20 border border-[#E2B4BD]/30 flex items-center justify-center text-[#F7D6D0]">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-playfair text-base font-bold text-[#FAF7F2]">
                Adjust &amp; Position Photo
              </h3>
              <p className="text-[11px] text-[#FAF7F2]/70">
                {slotLabel} &bull;{" "}
                <span className="text-[#F7D6D0] font-medium">
                  {formatRatio(aspectRatio)} ({Math.round(targetWidth)} &times; {Math.round(targetHeight)}px)
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full hover:bg-white/10 text-[#FAF7F2]/70 hover:text-[#FAF7F2] transition-colors flex items-center justify-center cursor-pointer"
            title="Cancel"
            aria-label="Cancel and close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Framing Mode Toggle Bar */}
        <div className="px-5 py-2.5 bg-black/30 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-[#FAF7F2]/60 font-light">Framing Option:</span>
          <div className="flex items-center bg-white/[0.06] rounded-xl p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => handleSwitchMode("fill")}
              className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg font-medium transition-all ${
                cropMode === "fill"
                  ? "bg-[#E2B4BD]/30 text-[#F7D6D0] shadow-sm font-semibold"
                  : "text-[#FAF7F2]/70 hover:text-[#FAF7F2]"
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fill Frame (No Bars)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("fit")}
              className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg font-medium transition-all ${
                cropMode === "fit"
                  ? "bg-[#E2B4BD]/30 text-[#F7D6D0] shadow-sm font-semibold"
                  : "text-[#FAF7F2]/70 hover:text-[#FAF7F2]"
              }`}
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Fit Whole Photo</span>
            </button>
          </div>
        </div>

        {/* Viewport / Crop Workspace */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-black/40 select-none">
          <div
            ref={containerRef}
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 1 && isDragging) {
                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchEnd={handlePointerUp}
            style={{
              aspectRatio: `${aspectRatio}`,
              maxHeight: "360px",
              width: aspectRatio >= 1 ? "100%" : "auto",
              height: aspectRatio < 1 ? "320px" : "auto",
            }}
            className={`relative rounded-2xl overflow-hidden border-2 border-[#E2B4BD]/80 shadow-2xl cursor-grab active:cursor-grabbing touch-none bg-[#120d11] ${
              isDragging ? "ring-4 ring-[#E2B4BD]/30" : ""
            }`}
          >
            {/* Ambient blur backdrop for Fit mode */}
            {cropMode === "fit" && imageSrc && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageSrc}
                alt="Backdrop ambient blur"
                className="absolute inset-0 w-full h-full object-cover filter blur-lg opacity-40 scale-110 pointer-events-none"
              />
            )}

            {/* The underlying image scaled and shifted */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={handleImageLoad}
              style={{
                width: `${currentRenderW}px`,
                height: `${currentRenderH}px`,
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                transition: isDragging ? "none" : "transform 0.12s ease-out",
              }}
              className="pointer-events-none select-none max-w-none"
            />

            {/* Viewfinder Rule-of-Thirds Grid */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div />
            </div>

            {/* Hint Badge */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2.5 py-1 rounded-full text-[10px] text-[#FAF7F2]/80 pointer-events-none flex items-center gap-1.5 backdrop-blur-sm border border-white/10">
              <Move className="w-3 h-3 text-[#F7D6D0]" />
              <span>Drag to reposition &bull; Slider to zoom</span>
            </div>
          </div>
        </div>

        {/* Interactive Controls Toolbar */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex flex-col gap-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.3, +(prev - 0.1).toFixed(2)))}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-black/40 hover:bg-black/60 text-[#FAF7F2]/80 hover:text-[#FAF7F2] border border-white/10 transition-all active:scale-95"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.02"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[#E2B4BD] h-2 bg-black/40 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-[#F7D6D0] w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.1).toFixed(2)))}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-black/40 hover:bg-black/60 text-[#FAF7F2]/80 hover:text-[#FAF7F2] border border-white/10 transition-all active:scale-95"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              className="min-h-[44px] px-3.5 rounded-xl bg-black/40 hover:bg-black/60 text-[#FAF7F2]/80 hover:text-[#FAF7F2] border border-white/10 transition-all flex items-center justify-center gap-1.5 text-xs active:scale-95"
              title="Reset Position"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-3 bg-white/[0.02]">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-5 py-2.5 rounded-full border border-white/20 text-[#FAF7F2]/80 hover:text-[#FAF7F2] text-xs font-medium hover:bg-white/10 transition-all active:scale-95"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isApplying || !isReadyToApply}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-full bg-gradient-to-r from-[#E2B4BD] to-[#F7D6D0] hover:brightness-105 text-[#181116] font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isApplying ? (
              <Sparkles className="w-4 h-4 animate-spin text-[#181116]" />
            ) : (
              <Check className="w-4 h-4 text-[#181116]" />
            )}
            <span>{isApplying ? "Applying..." : "Apply to Story"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
