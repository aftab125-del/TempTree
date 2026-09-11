"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Crop, Layers, Download, Upload, ArrowRight, Wand2, CheckCircle2 } from "lucide-react";

interface StepItem {
  id: string;
  number: string;
  title: string;
  description: string;
  dockActiveIcon: number;
}

const STEPS: StepItem[] = [
  {
    id: "upload",
    number: "01",
    title: "Upload your frame",
    description:
      "Drag and drop any aesthetic frame, moodboard, or polaroid collage. We support JPG, PNG, and WebP with instant in-browser processing.",
    dockActiveIcon: 0,
  },
  {
    id: "detect",
    number: "02",
    title: "Auto-detect photo slots",
    description:
      "Our visual analysis engine scans your template, measures placeholder proportions, and generates transparent cutouts in milliseconds.",
    dockActiveIcon: 1,
  },
  {
    id: "export",
    number: "03",
    title: "Crop photos & export in HD",
    description:
      "Fit your favorite photos with exact proportional cropping. Download crisp, uncompressed 1080×1920 PNG stories ready to share.",
    dockActiveIcon: 3,
  },
];

interface TileItem {
  id: string;
  bg: string;
  label: string;
  tag: string;
  border?: string;
  badge?: string;
}

// Aesthetic mock tiles representing the visual transformation in the 3D card
const STEP_TILES: Record<string, TileItem[]> = {
  upload: [
    {
      id: "u1",
      bg: "bg-gradient-to-tr from-mauve/40 via-peachPink/50 to-cream/70",
      label: "Polaroid Frame",
      tag: "Raw Frame",
    },
    {
      id: "u2",
      bg: "bg-gradient-to-br from-plum-dark via-charcoal to-mauve/30",
      label: "Collage Grid",
      tag: "PNG Asset",
    },
    {
      id: "u3",
      bg: "bg-gradient-to-tr from-charcoal via-plum-light/50 to-peachPink/40",
      label: "Film Strip",
      tag: "1080×1920",
    },
    {
      id: "u4",
      bg: "bg-gradient-to-bl from-peachPink/40 via-mauve/50 to-charcoal",
      label: "Minimal Canvas",
      tag: "Moodboard",
    },
    {
      id: "u5",
      bg: "bg-gradient-to-br from-charcoal via-plum-dark to-mauve/20",
      label: "Scrapbook",
      tag: "Instagram Story",
    },
    {
      id: "u6",
      bg: "bg-gradient-to-tl from-mauve/50 via-cream/40 to-peachPink/30",
      label: "Y2K Chrome",
      tag: "Template",
    },
  ],
  detect: [
    {
      id: "d1",
      bg: "bg-charcoal/90",
      border: "border-2 border-dashed border-peachPink/80",
      label: "Slot 1: 4:5",
      tag: "Detected",
      badge: "✦ 864×1080",
    },
    {
      id: "d2",
      bg: "bg-charcoal/90",
      border: "border-2 border-dashed border-dustyMauve",
      label: "Slot 2: 1:1",
      tag: "Cutout Ready",
      badge: "✦ 720×720",
    },
    {
      id: "d3",
      bg: "bg-charcoal/90",
      border: "border-2 border-dashed border-cream/70",
      label: "Slot 3: 16:9",
      tag: "Detected",
      badge: "✦ 960×540",
    },
    {
      id: "d4",
      bg: "bg-charcoal/90",
      border: "border-2 border-dashed border-dustyMauve",
      label: "Slot 4: 4:5",
      tag: "Alpha Window",
      badge: "✦ 864×1080",
    },
    {
      id: "d5",
      bg: "bg-charcoal/90",
      border: "border-2 border-dashed border-peachPink/80",
      label: "Slot 5: 1:1",
      tag: "Detected",
      badge: "✦ 720×720",
    },
    {
      id: "d6",
      bg: "bg-charcoal/90",
      border: "border-2 border-dashed border-cream/70",
      label: "Slot 6: 9:16",
      tag: "Cutout Ready",
      badge: "✦ 608×1080",
    },
  ],
  export: [
    {
      id: "e1",
      bg: "bg-gradient-to-tr from-[#ff9a9e] to-[#fecfef]",
      label: "Golden Hour",
      tag: "Filled Photo",
      badge: "1080×1920 HD",
    },
    {
      id: "e2",
      bg: "bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb]",
      label: "Tokyo Drift",
      tag: "Filled Photo",
      badge: "1080×1920 HD",
    },
    {
      id: "e3",
      bg: "bg-gradient-to-tr from-[#fad0c4] to-[#ffd1ff]",
      label: "Summer Bloom",
      tag: "Filled Photo",
      badge: "1080×1920 HD",
    },
    {
      id: "e4",
      bg: "bg-gradient-to-bl from-[#ffecd2] to-[#fcb69f]",
      label: "Sunset Glow",
      tag: "Filled Photo",
      badge: "1080×1920 HD",
    },
    {
      id: "e5",
      bg: "bg-gradient-to-tr from-[#ff9a9e] to-[#fecfef]",
      label: "Cafe Morning",
      tag: "Filled Photo",
      badge: "1080×1920 HD",
    },
    {
      id: "e6",
      bg: "bg-gradient-to-br from-[#d4fc79] to-[#96e6a1]",
      label: "Garden Walk",
      tag: "Filled Photo",
      badge: "1080×1920 HD",
    },
  ],
};

export default function HowItWorksStepper() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive mobile viewport detection (< 640px)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-advance stepper every 6 seconds unless hovered
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const currentStepData = STEPS[activeStep];
  const stepKey = currentStepData.id as keyof typeof STEP_TILES;
  const currentTiles = STEP_TILES[stepKey];

  return (
    <section
      id="how-it-works"
      className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Outer Sleek Container (matching the reference photo card) */}
      <div className="relative rounded-3xl bg-[#161315]/90 border border-dustyMauve/25 shadow-2xl p-6 sm:p-10 lg:p-14 overflow-hidden backdrop-blur-xl">
        {/* Subtle Ambient Background Gradient Glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-mauve/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-peachPink/10 blur-[120px]" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* ============================================================== */}
          {/* LEFT COLUMN: Main Title & Interactive Stepper                  */}
          {/* ============================================================== */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Small Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mauve/20 border border-dustyMauve/30 text-cream text-xs font-semibold uppercase tracking-widest mb-4 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-peachPink animate-pulse" />
              <span>How It Works</span>
            </div>

            {/* Headline matching "AI Videos, reimagined." */}
            <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-cream mb-10 leading-[1.1]">
              Story frames, <br />
              <span className="italic font-normal text-peachPink">reimagined.</span>
            </h2>

            {/* Vertical Stepper Timeline */}
            <div className="relative pl-6 space-y-8">
              {/* Continuous vertical timeline track */}
              <div className="absolute left-[3px] top-2 bottom-2 w-[2px] bg-dustyMauve/20" />

              {STEPS.map((step, idx) => {
                const isActive = idx === activeStep;

                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveStep(idx)}
                    className="relative cursor-pointer group transition-all duration-300"
                  >
                    {/* Active vertical solid bar indicator */}
                    {isActive ? (
                      <motion.div
                        layoutId="activeStepperIndicator"
                        className="absolute -left-[23px] top-1 w-[4px] h-full rounded-full bg-cream shadow-[0_0_12px_rgba(255,245,245,0.7)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    ) : (
                      <div className="absolute -left-[23px] top-2 w-[4px] h-3 rounded-full bg-dustyMauve/30 group-hover:bg-dustyMauve/60 transition-colors" />
                    )}

                    {/* Step Content */}
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-mono font-medium transition-colors duration-300 ${
                            isActive ? "text-peachPink font-bold" : "text-cream/40 group-hover:text-cream/70"
                          }`}
                        >
                          {step.number}
                        </span>
                        <h3
                          className={`text-lg sm:text-xl font-poppins font-semibold tracking-tight transition-colors duration-300 ${
                            isActive
                              ? "text-cream"
                              : "text-cream/50 group-hover:text-cream/80"
                          }`}
                        >
                          {step.title}
                        </h3>
                      </div>

                      {/* Expandable description for active step */}
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="font-poppins text-xs sm:text-sm text-cream/75 font-light leading-relaxed mt-2 max-w-md">
                              {step.description}
                            </p>

                            {/* Contextual Action Button */}
                            <div className="mt-4 pt-1">
                              <Link
                                href="/gallery"
                                className="inline-flex items-center gap-2 text-xs font-semibold text-cream hover:text-peachPink transition-colors group/link"
                              >
                                <span>Try this step now</span>
                                <ArrowRight className="w-3.5 h-3.5 group-link-hover:translate-x-1 transition-transform" />
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: 3D Perspective Card & Changing Visual Grid       */}
          {/* ============================================================== */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div
              className="w-full max-w-md lg:max-w-lg transition-transform duration-500 ease-out will-change-transform overflow-hidden sm:overflow-visible"
              style={{
                perspective: isMobile ? "none" : "1200px",
              }}
            >
              {/* 3D Tilted Device Card (matching the tablet in the user reference photo; flattened on mobile) */}
              <motion.div
                animate={{
                  rotateY: isMobile ? 0 : activeStep === 0 ? -9 : activeStep === 1 ? -6 : -8,
                  rotateX: isMobile ? 0 : activeStep === 0 ? 5 : activeStep === 1 ? 3 : 4,
                  rotateZ: isMobile ? 0 : activeStep === 0 ? -1 : activeStep === 1 ? 0 : -1,
                  y: isMobile ? 0 : [0, -4, 0],
                }}
                transition={{
                  rotateY: { type: "spring", stiffness: 180, damping: 22 },
                  rotateX: { type: "spring", stiffness: 180, damping: 22 },
                  rotateZ: { type: "spring", stiffness: 180, damping: 22 },
                  y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                }}
                className="relative rounded-3xl bg-[#201c1e]/95 border border-dustyMauve/30 p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-md overflow-hidden"
              >
                {/* Header status bar in 3D frame */}
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-dustyMauve/15 text-xs text-cream/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-peachPink animate-ping" />
                    <span className="font-mono text-[11px] text-cream/80">
                      Step {currentStepData.number} / {STEPS.length}
                    </span>
                  </div>
                  <span className="font-poppins text-[11px] uppercase tracking-wider text-dustyMauve font-medium">
                    {activeStep === 0 && "Asset Ingest"}
                    {activeStep === 1 && "Visual Slot Analyzer"}
                    {activeStep === 2 && "Proportional Export"}
                  </span>
                </div>

                {/* 2x3 Grid of Rounded Visual Tiles (Animated on step change) */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={stepKey}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-3 gap-3 sm:gap-4 mb-6"
                  >
                    {currentTiles.map((tile) => (
                      <div
                        key={`${stepKey}-${tile.id}`}
                        className={`relative aspect-[3/4] rounded-2xl overflow-hidden flex flex-col justify-between p-2.5 shadow-md group ${
                          tile.bg
                        } ${tile.border || "border border-white/10"}`}
                      >
                        {/* Cutout / Detected Slot Wireframe Overlay on Step 1 */}
                        {activeStep === 1 && (
                          <div className="absolute inset-2 rounded-lg border border-dashed border-peachPink/60 bg-black/40 flex items-center justify-center">
                            <span className="text-[10px] font-mono font-bold text-cream bg-charcoal/80 px-1.5 py-0.5 rounded">
                              {tile.label}
                            </span>
                          </div>
                        )}

                        {/* Top tag */}
                        <div className="flex justify-between items-start z-10">
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-black/40 text-cream/90 backdrop-blur-sm">
                            {tile.tag}
                          </span>
                          {activeStep === 2 && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-peachPink" />
                          )}
                        </div>

                        {/* Bottom label */}
                        <div className="z-10">
                          <p className="text-[10px] font-semibold text-white truncate drop-shadow-sm">
                            {tile.label}
                          </p>
                          {tile.badge && (
                            <p className="text-[8px] font-mono text-white/80">
                              {tile.badge}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Bottom Floating Pill Dock (Matching the 4 icons in reference photo) */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#181517]/90 border border-dustyMauve/30 shadow-inner">
                    <button
                      onClick={() => setActiveStep(0)}
                      aria-label="Upload step"
                      className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-300 ${
                        activeStep === 0
                          ? "bg-cream text-charcoal shadow-md scale-105"
                          : "text-cream/60 hover:text-cream hover:bg-white/5"
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveStep(1)}
                      aria-label="Detect slots step"
                      className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-300 ${
                        activeStep === 1
                          ? "bg-cream text-charcoal shadow-md scale-105"
                          : "text-cream/60 hover:text-cream hover:bg-white/5"
                      }`}
                    >
                      <Wand2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveStep(1)}
                      aria-label="Layer cutouts"
                      className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-300 ${
                        activeStep === 1
                          ? "bg-dustyMauve/30 text-peachPink"
                          : "text-cream/60 hover:text-cream hover:bg-white/5"
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveStep(2)}
                      aria-label="Export step"
                      className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-300 ${
                        activeStep === 2
                          ? "bg-cream text-charcoal shadow-md scale-105"
                          : "text-cream/60 hover:text-cream hover:bg-white/5"
                      }`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
