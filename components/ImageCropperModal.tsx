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

  // Zoom: 1.0 is cover (fills the crop window completely)
  const [zoom, setZoom] = useState<number>(1);
  // Pan offset in normalized percentage [-0.5 to 0.5]
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isApplying, setIsApplying] = useState(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset state and preload image when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });

      if (imageSrc) {
        const testImg = new Image();
        testImg.onload = () => {
          setNaturalSize({
            width: testImg.naturalWidth || 800,
            height: testImg.naturalHeight || 800,
          });
          setImageLoaded(true);
        };
        testImg.src = imageSrc;
        if (testImg.complete && testImg.naturalWidth > 0) {
          setNaturalSize({
            width: testImg.naturalWidth,
            height: testImg.naturalHeight,
          });
          setImageLoaded(true);
        } else {
          setImageLoaded(false);
        }
      } else {
        setImageLoaded(false);
      }
    }
  }, [isOpen, imageSrc]);

  // Load natural dimensions from rendered img element
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({
      width: img.naturalWidth || 800,
      height: img.naturalHeight || 800,
    });
    setImageLoaded(true);
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
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = (clientX - dragStart.x) / rect.width;
      const deltaY = (clientY - dragStart.y) / rect.height;

      // Bound the offset so image cannot be dragged completely outside
      const maxDrag = Math.max(0.5, (zoom - 1) / 2 + 0.3);
      const newX = Math.max(-maxDrag, Math.min(maxDrag, initialOffset.x + deltaX));
      const newY = Math.max(-maxDrag, Math.min(maxDrag, initialOffset.y + deltaY));

      setOffset({ x: newX, y: newY });
    },
    [isDragging, dragStart, initialOffset, zoom]
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

      // Crop canvas with target slot dimensions (min 800px for crisp render)
      const exportWidth = Math.max(targetWidth, 800);
      const exportHeight = Math.round(exportWidth / aspectRatio);

      const canvas = document.createElement("canvas");
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not create canvas 2D context");

      // Calculate how the image covers the aspect ratio at zoom = 1
      const imageRatio = nw / nh;
      let baseCropW = nw;
      let baseCropH = nh;

      if (imageRatio > aspectRatio) {
        // Image is wider than crop box: height is the limiter
        baseCropW = nh * aspectRatio;
      } else {
        // Image is taller than crop box: width is the limiter
        baseCropH = nw / aspectRatio;
      }

      // Applying zoom reduces the sample window
      const sampleW = baseCropW / zoom;
      const sampleH = baseCropH / zoom;

      // Calculate center + offset
      const centerX = nw / 2;
      const centerY = nh / 2;

      // Offset translates into natural image pixels
      const pixelOffsetX = -offset.x * baseCropW;
      const pixelOffsetY = -offset.y * baseCropH;

      let sx = centerX - sampleW / 2 + pixelOffsetX;
      let sy = centerY - sampleH / 2 + pixelOffsetY;

      // Clamp within image bounds
      sx = Math.max(0, Math.min(nw - sampleW, sx));
      sy = Math.max(0, Math.min(nh - sampleH, sy));

      // Draw high resolution crop
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sampleW, sampleH, 0, 0, exportWidth, exportHeight);

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
    <div className="fixed inset-0 z-50 bg-charcoal-dark/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-charcoal text-blushWhite rounded-3xl border border-dustyMauve/30 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-dustyMauve/20 flex items-center justify-between bg-charcoal-light/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-dustyMauve/20 border border-peachPink/30 flex items-center justify-center text-peachPink">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-playfair text-base font-bold text-blushWhite">
                Adjust & Crop Photo
              </h3>
              <p className="text-[11px] text-blushWhite/70">
                {slotLabel} &bull;{" "}
                <span className="text-peachPink font-medium">
                  {formatRatio(aspectRatio)} ({Math.round(targetWidth)} &times; {Math.round(targetHeight)}px)
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-charcoal-light text-blushWhite/70 hover:text-blushWhite transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Crop Workspace */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-charcoal-dark/50 select-none">
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
            className={`relative rounded-2xl overflow-hidden border-2 border-peachPink/80 shadow-2xl cursor-grab active:cursor-grabbing touch-none bg-charcoal-dark ${
              isDragging ? "ring-4 ring-peachPink/30" : ""
            }`}
          >
            {/* The underlying image scaled and shifted */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={handleImageLoad}
              style={{
                transform: `translate(${offset.x * 100}%, ${offset.y * 100}%) scale(${zoom})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              className="w-full h-full object-cover pointer-events-none select-none max-w-none"
            />

            {/* Viewfinder Overlay Guides (Grid Lines) */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>

            {/* Hint Badge */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-charcoal-dark/80 px-2.5 py-1 rounded-full text-[10px] text-blushWhite/80 pointer-events-none flex items-center gap-1.5 backdrop-blur-sm border border-dustyMauve/30">
              <Move className="w-3 h-3 text-peachPink" />
              <span>Drag to reposition &bull; Slider to zoom</span>
            </div>
          </div>
        </div>

        {/* Interactive Controls Toolbar */}
        <div className="px-5 py-3 border-t border-dustyMauve/20 bg-charcoal-light/20 flex flex-col gap-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.1).toFixed(2)))}
              className="p-1.5 rounded-lg bg-charcoal hover:bg-charcoal-light text-blushWhite/80 hover:text-blushWhite border border-dustyMauve/20 transition-all"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="3"
                step="0.02"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-dustyMauve h-1.5 bg-charcoal rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-peachPink w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <button
              onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.1).toFixed(2)))}
              className="p-1.5 rounded-lg bg-charcoal hover:bg-charcoal-light text-blushWhite/80 hover:text-blushWhite border border-dustyMauve/20 transition-all"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded-lg bg-charcoal hover:bg-charcoal-light text-blushWhite/80 hover:text-blushWhite border border-dustyMauve/20 transition-all flex items-center gap-1 text-[11px] px-2.5"
              title="Reset Position"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-dustyMauve/20 flex items-center justify-between bg-charcoal-light/30">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-dustyMauve/30 text-blushWhite/80 hover:text-blushWhite text-xs font-medium hover:bg-charcoal-light transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleApplyCrop}
            disabled={isApplying || !isReadyToApply}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-peachPink hover:bg-blushWhite text-charcoal font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isApplying ? (
              <Sparkles className="w-4 h-4 animate-spin text-charcoal" />
            ) : (
              <Check className="w-4 h-4 text-charcoal" />
            )}
            <span>{isApplying ? "Cropping..." : "Apply to Story"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
