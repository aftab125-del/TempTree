"use client";

import React, { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/types/template";
import { ArrowDown, Sparkles } from "lucide-react";

/**
 * SakuraScrollHero Component
 * -------------------------------------------------------------
 * Enhanced with Scroll-World Engine features:
 * - Physics-based continuous RAF Lerp scrubbing (smooth momentum interpolation)
 * - Atmospheric depth layer: drifting sakura petals & ambient lighting with scroll parallax
 * - Linger dwell easing (lingerEase) for storytelling milestones
 * - Interactive Chapter Route indicator (01 Sprout -> 02 Aesthetics -> 03 Full Bloom -> 04 Canvases)
 * - Hairline flight progress bar with radiant glow
 * - Mobile touch & resize hardening (ignoring URL bar height fluctuations)
 * - Pinned full-viewport background on homepage (freezes on frame 300 at 100% scroll)
 */

const TOTAL_FRAMES = 300;
const LERP_FACTOR = 0.16; // Silky Apple-style scrub momentum
const LERP_EPSILON = 0.0004;

// Story milestone chapters
interface Chapter {
  id: string;
  num: string;
  label: string;
  progress: number;
}

const CHAPTERS: Chapter[] = [
  { id: "sprout", num: "01", label: "Sprout", progress: 0.0 },
  { id: "aesthetics", num: "02", label: "Aesthetics", progress: 0.45 },
  { id: "bloom", num: "03", label: "Full Bloom", progress: 0.88 },
  { id: "gallery", num: "04", label: "Canvases", progress: 1.0 },
];

// Seeded atmospheric floating petal data
interface PetalParticle {
  id: number;
  left: number;
  top: number;
  scale: number;
  driftX: number;
  rot: number;
  duration: number;
  delay: number;
  opacity: number;
  tone: "mauve" | "peach" | "blush";
}

const SEEDED_PETALS: PetalParticle[] = [
  { id: 1, left: 8, top: 15, scale: 0.9, driftX: 35, rot: 190, duration: 18, delay: 0, opacity: 0.65, tone: "peach" },
  { id: 2, left: 18, top: 45, scale: 1.2, driftX: -40, rot: 240, duration: 22, delay: 2.5, opacity: 0.5, tone: "mauve" },
  { id: 3, left: 28, top: 80, scale: 0.75, driftX: 45, rot: 160, duration: 16, delay: 4.2, opacity: 0.7, tone: "blush" },
  { id: 4, left: 38, top: 25, scale: 1.1, driftX: -30, rot: 210, duration: 24, delay: 1.1, opacity: 0.6, tone: "peach" },
  { id: 5, left: 48, top: 70, scale: 0.85, driftX: 50, rot: 270, duration: 19, delay: 5.5, opacity: 0.55, tone: "mauve" },
  { id: 6, left: 58, top: 10, scale: 1.3, driftX: -45, rot: 180, duration: 25, delay: 3.0, opacity: 0.75, tone: "peach" },
  { id: 7, left: 68, top: 60, scale: 0.7, driftX: 30, rot: 230, duration: 15, delay: 6.2, opacity: 0.65, tone: "blush" },
  { id: 8, left: 78, top: 35, scale: 1.05, driftX: -35, rot: 150, duration: 21, delay: 1.8, opacity: 0.5, tone: "mauve" },
  { id: 9, left: 88, top: 75, scale: 0.95, driftX: 40, rot: 200, duration: 17, delay: 4.9, opacity: 0.6, tone: "peach" },
  { id: 10, left: 14, top: 88, scale: 0.8, driftX: -25, rot: 175, duration: 20, delay: 7.1, opacity: 0.7, tone: "blush" },
  { id: 11, left: 84, top: 18, scale: 1.15, driftX: 35, rot: 260, duration: 23, delay: 2.1, opacity: 0.55, tone: "peach" },
  { id: 12, left: 52, top: 92, scale: 0.75, driftX: -30, rot: 190, duration: 18, delay: 6.8, opacity: 0.65, tone: "mauve" },
  { id: 13, left: 32, top: 5, scale: 1.0, driftX: 28, rot: 220, duration: 22, delay: 0.5, opacity: 0.5, tone: "blush" },
  { id: 14, left: 92, top: 50, scale: 0.85, driftX: -38, rot: 140, duration: 16, delay: 3.7, opacity: 0.65, tone: "peach" },
];

export default function SakuraScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // In-memory array of preloaded frames
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Physics scrub engine values
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const rafHandleRef = useRef<number | null>(null);
  const lastRenderedIndexRef = useRef<number>(-1);

  // Viewport & device detection
  const laidOutWRef = useRef<number>(0);
  const isCoarsePointerRef = useRef<boolean>(false);
  const reduceMotionRef = useRef<boolean>(false);

  // React state for UI rendering
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [uiProgress, setUiProgress] = useState<number>(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  // ============================================================================
  // STEP 1: Preload all 300 frames on mount
  // ============================================================================
  useEffect(() => {
    let isMounted = true;
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    // Detect coarse pointers (touchscreens) and reduced-motion preference
    if (typeof window !== "undefined") {
      isCoarsePointerRef.current = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
      reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      laidOutWRef.current = window.innerWidth;
    }

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const padIndex = String(i).padStart(3, "0");
      const img = new Image();
      img.src = `/sakura-frames/ezgif-frame-${padIndex}.png`;

      const handleImageLoadOrError = () => {
        if (!isMounted) return;
        loadedCount++;
        const pct = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        setLoadProgress(pct);

        // Instantly draw frame 0 as soon as the first frame loads
        if (i === 1) {
          handleResize();
          drawFrame(0);
        }

        if (loadedCount >= TOTAL_FRAMES) {
          setIsLoaded(true);
        }
      };

      img.onload = handleImageLoadOrError;
      img.onerror = handleImageLoadOrError;
      images.push(img);
    }

    imagesRef.current = images;

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================================================
  // STEP 2: Draw a specific frame to the Canvas with 'cover' aspect ratio
  // ============================================================================
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));
    let img = imagesRef.current[clampedIndex];

    // Fallback to nearest loaded frame below if pending
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let j = clampedIndex - 1; j >= 0; j--) {
        const candidate = imagesRef.current[j];
        if (candidate && candidate.complete && candidate.naturalWidth > 0) {
          img = candidate;
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Aspect ratio 'cover' math
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    lastRenderedIndexRef.current = clampedIndex;
  };

  // Resize canvas according to viewport dimensions & DPR
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    const targetFrame = Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1));
    drawFrame(targetFrame);
  };

  // ============================================================================
  // STEP 3: Scroll-World Continuous RAF Lerp Engine
  // ============================================================================
  useEffect(() => {
    if (!isLoaded) return;

    handleResize();
    drawFrame(0);

    let lastUiSync = 0;

    const tick = (now: number) => {
      const reduce = reduceMotionRef.current;
      const target = targetProgressRef.current;
      let current = currentProgressRef.current;

      const delta = target - current;

      if (Math.abs(delta) > LERP_EPSILON) {
        current += delta * (reduce ? 1 : LERP_FACTOR);
        currentProgressRef.current = current;
      } else if (current !== target) {
        current = target;
        currentProgressRef.current = target;
      }

      // Check if user has scrolled past the hero container (progress >= 1.0)
      if (current >= 0.999 && target >= 1.0) {
        if (lastRenderedIndexRef.current !== TOTAL_FRAMES - 1) {
          drawFrame(TOTAL_FRAMES - 1);
        }
      } else {
        const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(current * (TOTAL_FRAMES - 1))));
        if (frameIndex !== lastRenderedIndexRef.current) {
          drawFrame(frameIndex);
        }
      }

      // Sync UI state every ~32ms (30fps) to keep React re-renders silky without clogging RAF
      if (now - lastUiSync > 32 || current === 0 || current >= 1.0) {
        setUiProgress(current);

        // Update active chapter
        let activeIdx = 0;
        for (let i = 0; i < CHAPTERS.length; i++) {
          if (current >= CHAPTERS[i].progress - 0.08) {
            activeIdx = i;
          }
        }
        setActiveChapterIndex(activeIdx);
        lastUiSync = now;
      }

      rafHandleRef.current = requestAnimationFrame(tick);
    };

    rafHandleRef.current = requestAnimationFrame(tick);

    // Raw scroll position listener: computes targetProgressRef
    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScrollableDistance = rect.height - window.innerHeight;
      if (totalScrollableDistance <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.min(1, Math.max(0, currentScroll / totalScrollableDistance));
      targetProgressRef.current = progress;
    };

    // Mobile address-bar immune resize handler
    const onResize = () => {
      if (isCoarsePointerRef.current && window.innerWidth === laidOutWRef.current) {
        return;
      }
      laidOutWRef.current = window.innerWidth;
      handleResize();
      onScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (rafHandleRef.current !== null) {
        cancelAnimationFrame(rafHandleRef.current);
      }
    };
  }, [isLoaded]);

  // ============================================================================
  // STEP 4: Story Dwell & Linger Calculations (Scroll-World lingerEase)
  // ============================================================================
  const lingerEase = (x: number, L: number = 0.45) => {
    const clamped = Math.min(1, Math.max(0, x));
    const c = clamped - 0.5;
    return (1 - L) * clamped + L * (4 * c * c * c + 0.5);
  };

  // 1. Wordmark & Tagline: Active 0% to 15%
  const wordmarkOpacity =
    uiProgress <= 0.08
      ? 1
      : uiProgress <= 0.16
      ? 1 - (uiProgress - 0.08) / 0.08
      : 0;

  // 2. Category Names: Active 32% to 68%
  const isCategorySectionActive = uiProgress >= 0.30 && uiProgress <= 0.70;
  const rawCatProgress = Math.min(1, Math.max(0, (uiProgress - 0.32) / (0.68 - 0.32)));
  const easedCatProgress = lingerEase(rawCatProgress, 0.4);
  const activeCategoryIndex = Math.min(
    CATEGORIES.length - 1,
    Math.floor(easedCatProgress * CATEGORIES.length)
  );

  // Jump to specific chapter milestone
  const jumpToChapter = (chapter: Chapter) => {
    const container = containerRef.current;
    if (!container) return;

    if (chapter.id === "gallery" || chapter.progress >= 1.0) {
      const targetScroll = container.offsetTop + container.offsetHeight - window.innerHeight + 60;
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
      return;
    }

    const totalScrollableDistance = container.offsetHeight - window.innerHeight;
    const targetScroll = container.offsetTop + chapter.progress * totalScrollableDistance;
    window.scrollTo({ top: targetScroll, behavior: "smooth" });
  };

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* SCROLL-WORLD FEATURE 1: HAIRLINE FLIGHT PROGRESS BAR               */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-dustyPink/20">
        <div
          className="h-full bg-gradient-to-r from-dustyMauve via-peachPink to-blushWhite origin-left transition-transform duration-75 ease-out shadow-[0_0_12px_rgba(226,180,189,0.8)]"
          style={{ transform: `scaleX(${uiProgress})` }}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FIXED POSITION BACKGROUND CANVAS (HOMEPAGE ONLY)                   */}
      {/* Freezes on frame 300 once scroll reaches 100%                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <canvas ref={canvasRef} className="w-full h-full object-cover block" />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SCROLL-WORLD FEATURE 2: ATMOSPHERIC DEPTH & FLOATING PETALS LAYER  */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {/* Soft Radial Ambient Lighting */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-b from-peachPink/15 via-dustyMauve/10 to-transparent blur-3xl animate-ambient-glow" />
        <div className="absolute -bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-t from-dustyMauve/10 to-transparent blur-3xl pointer-events-none" />

        {/* Drifting Sakura Blossom Petals (with scroll parallax) */}
        <div
          className="absolute inset-0 transition-transform duration-100 ease-out"
          style={{ transform: `translate3d(0, ${-uiProgress * 70}px, 0)` }}
        >
          {SEEDED_PETALS.map((petal) => (
            <div
              key={petal.id}
              className="absolute animate-sakura-float"
              style={
                {
                  left: `${petal.left}%`,
                  top: `${petal.top}%`,
                  animationDuration: `${petal.duration}s`,
                  animationDelay: `${petal.delay}s`,
                  "--pt-scale": petal.scale,
                  "--pt-drift-x": `${petal.driftX}px`,
                  "--pt-rot": `${petal.rot}deg`,
                  "--pt-opacity": petal.opacity,
                } as React.CSSProperties
              }
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className={`drop-shadow-[0_2px_6px_rgba(226,180,189,0.35)] ${
                  petal.tone === "peach"
                    ? "text-[#F7D6D0]"
                    : petal.tone === "mauve"
                    ? "text-[#E2B4BD]"
                    : "text-[#FFF5F5]"
                }`}
              >
                <path
                  d="M12 2C7.5 2 4 6.5 4 11.5C4 16 7 20 12 22C17 20 20 16 20 11.5C20 6.5 16.5 2 12 2Z"
                  fill="currentColor"
                  fillOpacity="0.8"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FIXED DARK OVERLAY (bg-black/25) FOR HIGH CONTRAST TEXT            */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed inset-0 bg-black/25 pointer-events-none z-[2]" />

      {/* ------------------------------------------------------------------ */}
      {/* SCROLL-WORLD FEATURE 3: INTERACTIVE CHAPTER ROUTE INDICATOR         */}
      {/* ------------------------------------------------------------------ */}
      <aside
        aria-label="Story chapter navigation"
        className="fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-end gap-5 pointer-events-auto"
      >
        {CHAPTERS.map((ch, idx) => {
          const isActive = idx === activeChapterIndex;
          return (
            <button
              key={ch.id}
              onClick={() => jumpToChapter(ch)}
              className="group flex items-center gap-3 cursor-pointer py-1 px-2 focus:outline-none"
              aria-label={`Jump to chapter ${ch.num}: ${ch.label}`}
            >
              <span
                className={`font-poppins text-xs tracking-wider transition-all duration-300 font-medium ${
                  isActive
                    ? "opacity-100 translate-x-0 text-blushWhite drop-shadow-md font-semibold"
                    : "opacity-0 translate-x-2 group-hover:opacity-85 group-hover:translate-x-0 text-peachPink"
                }`}
              >
                {ch.num} &middot; {ch.label}
              </span>

              <div
                className={`rounded-full transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? "w-3.5 h-3.5 bg-dustyMauve shadow-[0_0_12px_rgba(226,180,189,0.9)] ring-4 ring-peachPink/30 scale-110"
                    : "w-2 h-2 bg-blushWhite/50 group-hover:bg-peachPink group-hover:scale-125"
                }`}
              />
            </button>
          );
        })}
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* PRELOADER SCREEN (Themed with brand palette)                        */}
      {/* ------------------------------------------------------------------ */}
      {!isLoaded && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-charcoal text-blushWhite px-6">
          <div className="flex items-center space-x-3 mb-6 animate-pulse">
            <Sparkles className="w-8 h-8 text-dustyMauve" />
            <h1 className="font-playfair text-4xl sm:text-5xl font-bold tracking-wider text-blushWhite">
              TempTree
            </h1>
          </div>

          <p className="font-poppins text-xs sm:text-sm uppercase tracking-[0.25em] text-peachPink mb-6 text-center font-medium">
            Gathering sakura blossoms & frames...
          </p>

          <div className="w-64 max-w-full h-2 bg-charcoal-light/80 rounded-full overflow-hidden border border-dustyMauve/40 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-dustyMauve via-peachPink to-blushWhite rounded-full transition-all duration-150 ease-out"
              style={{ width: `${loadProgress}%` }}
            />
          </div>

          <span className="font-poppins text-xs font-semibold text-peachPink mt-3">
            {loadProgress}% loaded
          </span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 300VH SCROLL TRACKER & TEXT OVERLAY CONTAINER                      */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={containerRef}
        className="relative z-10 w-full h-[300vh] selection:bg-dustyMauve selection:text-charcoal pointer-events-none"
      >
        {/* Sticky 100vh Viewport Overlay Container */}
        <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center pointer-events-none">
          {/* ---------------------------------------------------------------- */}
          {/* OVERLAY 1: Brand Wordmark + Tagline (0% - 15% progress)          */}
          {/* ---------------------------------------------------------------- */}
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 transition-all duration-300"
            style={{
              opacity: wordmarkOpacity,
              transform: `translateY(${(1 - wordmarkOpacity) * -24}px)`,
              pointerEvents: wordmarkOpacity > 0.1 ? "auto" : "none",
            }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-charcoal/80 border border-dustyMauve/40 backdrop-blur-md mb-4 shadow-xl">
              <Sparkles className="w-4 h-4 text-peachPink animate-pulse" />
              <span className="text-xs uppercase tracking-[0.25em] text-blushWhite font-medium">
                Aesthetic Story Studio
              </span>
            </div>

            <h1 className="font-playfair text-6xl sm:text-8xl md:text-9xl font-extrabold text-blushWhite tracking-tight drop-shadow-2xl">
              TempTree
            </h1>

            <p className="font-poppins text-lg sm:text-2xl text-blushWhite/90 font-light tracking-wide max-w-md mt-4 drop-shadow-md">
              Find your aesthetic.
            </p>

            <p className="font-poppins text-xs uppercase tracking-[0.3em] text-peachPink mt-2 font-medium">
              Instagram Story Templates &middot; 1080 &times; 1920
            </p>

            {/* Scroll Prompt Button */}
            <button
              onClick={() => jumpToChapter(CHAPTERS[1])}
              className="mt-12 flex flex-col items-center gap-2 text-blushWhite/80 hover:text-blushWhite transition-colors duration-300 group cursor-pointer"
              aria-label="Scroll to explore"
            >
              <span className="text-xs uppercase tracking-widest font-light">
                Scroll to explore
              </span>
              <div className="w-8 h-8 rounded-full border border-blushWhite/40 flex items-center justify-center group-hover:border-blushWhite group-hover:bg-blushWhite/10 transition-all duration-300">
                <ArrowDown className="w-4 h-4 text-blushWhite animate-bounce" />
              </div>
            </button>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* OVERLAY 2: Category Names Reveal (32% - 68% progress with linger)*/}
          {/* ---------------------------------------------------------------- */}
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 transition-all duration-300"
            style={{
              opacity: isCategorySectionActive ? 1 : 0,
              pointerEvents: isCategorySectionActive ? "auto" : "none",
            }}
          >
            <div className="max-w-xl flex flex-col items-center">
              <span className="text-xs uppercase tracking-[0.3em] text-peachPink font-semibold mb-3 px-3.5 py-1 rounded-full bg-charcoal/80 border border-dustyMauve/40 backdrop-blur-md">
                Curated Dimensions
              </span>

              <h2 className="font-playfair text-3xl sm:text-4xl text-blushWhite font-normal italic mb-6 drop-shadow-md">
                Every mood, distilled.
              </h2>

              {/* Category Names Highlighted One by One */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 my-2">
                {CATEGORIES.map((cat, idx) => {
                  const isCurrent = idx === activeCategoryIndex;
                  return (
                    <div
                      key={cat}
                      className={`transition-all duration-500 transform ${
                        isCurrent
                          ? "scale-125 bg-blushWhite text-charcoal font-bold shadow-xl shadow-charcoal/50 border-2 border-blushWhite ring-4 ring-dustyMauve/60"
                          : "scale-95 bg-charcoal/75 text-blushWhite/70 border border-dustyMauve/30 backdrop-blur-sm"
                      } px-5 py-2.5 rounded-full text-sm sm:text-base tracking-wide`}
                    >
                      <span className="font-playfair">
                        {isCurrent ? `✦ ${cat} ✦` : cat}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Active Category Description Pill */}
              <div className="mt-8 text-blushWhite font-poppins text-xs sm:text-sm tracking-wide bg-charcoal/85 border border-dustyMauve/30 px-6 py-2.5 rounded-full backdrop-blur-md shadow-lg max-w-md">
                {activeCategoryIndex === 0 && "★ Y2K: Chrome stars, cyber nostalgia, and bold vibrant glow."}
                {activeCategoryIndex === 1 && "◇ Minimal: Timeless editorial typography with serene white space."}
                {activeCategoryIndex === 2 && "🌸 Dreamy: Ethereal sakura gradients, soft blush & glowing quotes."}
                {activeCategoryIndex === 3 && "🎞 Vintage: Nostalgic Polaroid borders, 35mm film grain & retro dates."}
                {activeCategoryIndex === 4 && "⚡ Bold: High-impact streetwear contrast & powerful headline blocks."}
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* OVERLAY 3: Transition Prompt (80% - 94% progress)                */}
          {/* ---------------------------------------------------------------- */}
          <div
            className="absolute bottom-12 z-20 flex flex-col items-center text-center transition-all duration-300"
            style={{
              opacity: uiProgress >= 0.80 && uiProgress < 0.94 ? 1 : 0,
            }}
          >
            <button
              onClick={() => jumpToChapter(CHAPTERS[3])}
              className="text-xs uppercase tracking-[0.25em] text-blushWhite bg-charcoal/80 hover:bg-charcoal border border-dustyMauve/40 px-5 py-2.5 rounded-full backdrop-blur-md shadow-lg hover:shadow-xl transition-all cursor-pointer pointer-events-auto"
            >
              Scroll down to browse templates &darr;
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
