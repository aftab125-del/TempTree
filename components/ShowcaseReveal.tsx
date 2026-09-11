"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Upload,
  ArrowRight,
  ChevronsLeftRight,
  Wand2,
  CheckCircle2,
  Maximize2,
  Layers,
  Heart,
  Camera,
} from "lucide-react";

interface ShowcasePreset {
  id: string;
  title: string;
  category: string;
  accentColor: string;
  slots: { label: string; ratio: string; w: string; h: string }[];
  afterTitle: string;
  afterSubtitle: string;
  bgGradient: string;
  afterPhotos: {
    url: string;
    caption?: string;
  }[];
}

const PRESETS: ShowcasePreset[] = [
  {
    id: "polaroid",
    title: "Polaroid Scrapbook",
    category: "Vintage",
    accentColor: "#F7D6D0",
    slots: [
      { label: "Slot 1", ratio: "4:5 Portrait", w: "860", h: "1080" },
      { label: "Slot 2", ratio: "1:1 Square", w: "720", h: "720" },
    ],
    afterTitle: "Golden Hour in Kyoto",
    afterSubtitle: "May 2026 · Captured on 35mm",
    bgGradient: "from-[#2b2124] via-[#1a1416] to-[#0f0c0d]",
    afterPhotos: [
      {
        url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
        caption: "Arashiyama Bamboo Grove",
      },
      {
        url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop",
        caption: "Tokyo Twilight",
      },
    ],
  },
  {
    id: "minimal",
    title: "Studio Editorial No. 4",
    category: "Minimal",
    accentColor: "#E2B4BD",
    slots: [
      { label: "Slot 1", ratio: "9:16 Story", w: "1080", h: "1920" },
    ],
    afterTitle: "Serenity & Space",
    afterSubtitle: "Architectural Digest · Issue 18",
    bgGradient: "from-[#231e21] via-[#181416] to-[#0d0a0c]",
    afterPhotos: [
      {
        url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop",
        caption: "Morning Reflections",
      },
    ],
  },
  {
    id: "sakura",
    title: "Sakura Dream Haze",
    category: "Dreamy",
    accentColor: "#FFF5F5",
    slots: [
      { label: "Slot 1", ratio: "3:4 Moodboard", w: "810", h: "1080" },
      { label: "Slot 2", ratio: "1:1 Detail", w: "640", h: "640" },
    ],
    afterTitle: "Under the Cherry Trees",
    afterSubtitle: "Spring Solstice Edition",
    bgGradient: "from-[#331e28] via-[#1f1319] to-[#120a0f]",
    afterPhotos: [
      {
        url: "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=1200&auto=format&fit=crop",
        caption: "Cherry Blossom Season",
      },
      {
        url: "https://images.unsplash.com/photo-1528164344705-475426879c0d?q=80&w=800&auto=format&fit=crop",
        caption: "Mt. Fuji Bloom",
      },
    ],
  },
];

export default function ShowcaseReveal() {
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activePreset = PRESETS[activePresetIndex];

  // Calculate percentage from pointer event
  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedPercentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(clampedPercentage);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    };

    const handlePointerUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging, updatePosition]);

  return (
    <section
      id="showcase"
      className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mauve/20 border border-dustyMauve/30 text-cream text-xs font-semibold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 text-peachPink" />
            <span>Interactive Showcase</span>
          </div>

          <h2 className="font-playfair text-4xl sm:text-5xl font-bold tracking-tight text-cream">
            Before &amp; After: <br />
            <span className="italic font-normal text-peachPink">
              See the transformation.
            </span>
          </h2>
          <p className="font-poppins text-cream/75 text-sm sm:text-base max-w-xl mt-3 font-light">
            Slide across to compare the raw template frame (with auto-detected cutout slots) to the final exported story filled with personal photos.
          </p>
        </div>

        {/* Preset Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-[#1c181a]/90 p-1.5 rounded-full border border-dustyMauve/20 backdrop-blur-md">
          {PRESETS.map((preset, idx) => {
            const isSelected = idx === activePresetIndex;
            return (
              <button
                key={preset.id}
                onClick={() => setActivePresetIndex(idx)}
                className={`px-4 py-2 rounded-full text-xs font-poppins transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "bg-cream text-charcoal font-bold shadow-md"
                    : "text-cream/60 hover:text-cream hover:bg-white/5"
                }`}
              >
                {preset.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* THE IMAGE REVEAL SLIDER CONTAINER (skiper71 pattern)           */}
      {/* ============================================================== */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9] min-h-[420px] rounded-3xl overflow-hidden border border-dustyMauve/30 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)] cursor-ew-resize select-none touch-pan-y group"
      >
        {/* Ambient background glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${activePreset.bgGradient} transition-colors duration-700`}
        />

        {/* ------------------------------------------------------------ */}
        {/* BASE LAYER: AFTER (The Finished Photo Story)                  */}
        {/* ------------------------------------------------------------ */}
        <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10 pointer-events-none">
          <div className="relative w-full h-full max-w-5xl flex items-center justify-around gap-6">
            {/* Story Card Container */}
            <div className="relative h-full aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black/60 flex flex-col justify-between p-4">
              {/* Finished Photo Content */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${activePreset.afterPhotos[0].url})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
              </div>

              {/* Story Overlay Header */}
              <div className="relative z-10 flex justify-between items-center text-white/90">
                <span className="font-playfair text-xs tracking-widest uppercase font-semibold">
                  {activePreset.afterTitle}
                </span>
                <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  1080×1920 HD
                </span>
              </div>

              {/* Story Overlay Footer */}
              <div className="relative z-10 text-white">
                <p className="font-playfair text-lg font-bold">
                  {activePreset.afterTitle}
                </p>
                <p className="font-poppins text-[11px] text-white/70">
                  {activePreset.afterSubtitle}
                </p>
              </div>
            </div>

            {/* Second Photo (Desktop only) */}
            {activePreset.afterPhotos[1] && (
              <div className="hidden sm:flex relative h-[85%] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black/60 flex-col justify-between p-4">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${activePreset.afterPhotos[1].url})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
                </div>
                <div className="relative z-10 flex justify-between items-center text-white/90">
                  <span className="font-playfair text-xs tracking-widest uppercase font-semibold">
                    {activePreset.afterPhotos[1].caption}
                  </span>
                  <Heart className="w-3.5 h-3.5 text-peachPink fill-peachPink" />
                </div>
                <div className="relative z-10 text-white">
                  <p className="font-poppins text-xs text-white/80">
                    Exported directly with TempTree
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Right Label: Finished Story */}
          <div className="absolute right-6 bottom-6 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 border border-white/20 text-cream text-[11px] font-semibold backdrop-blur-md shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-peachPink" />
              <span>After: Finished Story (Filled)</span>
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* TOP LAYER: BEFORE (Raw Uploaded Frame with Cutout Slots)     */}
        {/* Clipped based on sliderPosition percentage                   */}
        {/* ------------------------------------------------------------ */}
        <div
          className="absolute inset-0 flex items-center justify-center p-6 sm:p-10 pointer-events-none bg-[#141012]/95 border-r border-cream/50"
          style={{
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
          }}
        >
          {/* Subtle grid pattern for template preview */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:28px_28px]" />

          <div className="relative w-full h-full max-w-5xl flex items-center justify-around gap-6 z-10">
            {/* Template Frame 1 with Detected Cutouts */}
            <div className="relative h-full aspect-[9/16] rounded-2xl border-2 border-dustyMauve/50 bg-[#251f22] flex flex-col justify-between p-4 shadow-xl">
              {/* Frame Header */}
              <div className="flex justify-between items-center text-xs text-cream/70">
                <span className="font-mono text-[10px] text-peachPink">
                  Raw Template Frame
                </span>
                <span className="text-[10px] bg-charcoal/80 px-2 py-0.5 rounded border border-dustyMauve/30">
                  {activePreset.category}
                </span>
              </div>

              {/* Detected Photo Slot Mock (Dashed Empty Window) */}
              <div className="my-auto w-full aspect-[4/5] rounded-xl border-2 border-dashed border-peachPink/80 bg-black/60 flex flex-col items-center justify-center text-center p-3">
                <Wand2 className="w-6 h-6 text-peachPink mb-2 animate-pulse" />
                <span className="text-xs font-mono font-bold text-cream">
                  {activePreset.slots[0].label} Detected
                </span>
                <span className="text-[10px] font-mono text-peachPink/80 mt-1">
                  Ratio: {activePreset.slots[0].ratio}
                </span>
                <span className="text-[9px] font-mono text-cream/50 mt-0.5">
                  ({activePreset.slots[0].w} × {activePreset.slots[0].h} px)
                </span>
              </div>

              {/* Frame Footer */}
              <div className="text-xs text-cream/50 font-mono text-center">
                Waiting for photo drop...
              </div>
            </div>

            {/* Template Frame 2 (Desktop only) */}
            {activePreset.afterPhotos[1] && (
              <div className="hidden sm:flex relative h-[85%] aspect-[9/16] rounded-2xl border-2 border-dustyMauve/50 bg-[#251f22] flex-col justify-between p-4 shadow-xl">
                <div className="flex justify-between items-center text-xs text-cream/70">
                  <span className="font-mono text-[10px] text-peachPink">
                    Secondary Slot
                  </span>
                  <Layers className="w-3.5 h-3.5 text-dustyMauve" />
                </div>

                <div className="my-auto w-full aspect-square rounded-xl border-2 border-dashed border-dustyMauve bg-black/60 flex flex-col items-center justify-center text-center p-3">
                  <Camera className="w-5 h-5 text-dustyMauve mb-1" />
                  <span className="text-xs font-mono font-bold text-cream">
                    1:1 Square Slot
                  </span>
                  <span className="text-[9px] font-mono text-cream/60 mt-1">
                    Auto-Cutout Window
                  </span>
                </div>

                <div className="text-xs text-cream/50 font-mono text-center">
                  Alpha Cutout Ready
                </div>
              </div>
            )}
          </div>

          {/* Bottom Left Label: Before State */}
          <div className="absolute left-6 bottom-6 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 border border-dustyMauve/40 text-peachPink text-[11px] font-semibold backdrop-blur-md shadow-lg">
              <Wand2 className="w-3.5 h-3.5 text-peachPink" />
              <span>Before: Raw Frame (Empty Cutouts)</span>
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* SLIDER DIVIDER & DRAGGABLE HANDLE                             */}
        {/* ------------------------------------------------------------ */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-cream shadow-[0_0_15px_rgba(255,245,245,0.8)] pointer-events-none z-20"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Circular Grab Handle */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-cream text-charcoal shadow-2xl border-2 border-dustyMauve flex items-center justify-center transition-transform duration-150 ${
              isDragging ? "scale-110 ring-4 ring-peachPink/50" : "group-hover:scale-105"
            }`}
          >
            <ChevronsLeftRight className="w-5 h-5 text-charcoal" />
          </div>
        </div>

        {/* Drag Hint Pill (Centrally visible initially) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="px-3.5 py-1 rounded-full bg-black/70 border border-white/20 text-[11px] font-poppins text-cream/90 backdrop-blur-md shadow-md">
            Drag slider left or right ‹ ›
          </span>
        </div>
      </div>

      {/* Bottom Action Strip */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-[#161315]/80 border border-dustyMauve/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-mauve/25 border border-dustyMauve/40 flex items-center justify-center text-peachPink flex-shrink-0">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-playfair text-base font-bold text-cream">
              Have your own frame or moodboard?
            </h4>
            <p className="font-poppins text-xs text-cream/70 font-light">
              Upload any JPG or PNG image. Our engine detects slots and makes it editable in 2 seconds.
            </p>
          </div>
        </div>

        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cream text-charcoal font-bold text-xs hover:bg-peachPink transition-all shadow-md active:scale-95 group/btn flex-shrink-0"
        >
          <Upload className="w-3.5 h-3.5 text-charcoal group-hover/btn:scale-110 transition-transform" />
          <span>Upload Your Template Now</span>
          <ArrowRight className="w-3.5 h-3.5 text-charcoal group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
