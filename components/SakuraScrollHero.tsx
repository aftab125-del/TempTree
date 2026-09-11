"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, Sparkles } from "lucide-react";

/**
 * SakuraScrollHero Component
 * -------------------------------------------------------------
 * High-performance, 60fps/120fps GPU-optimized scroll hero:
 * - On-demand RAF loop: runs ONLY when actively scrolling or momentum settling; IDLE (0% CPU) otherwise.
 * - Direct DOM manipulation for high-frequency properties (progress bar, parallax, opacity).
 * - React state updates strictly quarantined to threshold crossing (zero 60fps re-render churn).
 * - Aspect-ratio cover canvas redraws ONLY when rounded frame index changes.
 * - Fixed background freezes on frame 300 at 100% scroll.
 */

const TOTAL_FRAMES = 300;
const LERP_FACTOR = 0.18;
const LERP_EPSILON = 0.0005;

interface Chapter {
  id: string;
  num: string;
  label: string;
  progress: number;
}

const CHAPTERS: Chapter[] = [
  { id: "sprout", num: "01", label: "Sprout", progress: 0.0 },
  { id: "studio", num: "02", label: "Atelier", progress: 0.45 },
  { id: "bloom", num: "03", label: "Full Bloom", progress: 0.88 },
  { id: "gallery", num: "04", label: "Canvases", progress: 1.0 },
];

interface StudioPillar {
  icon: string;
  title: string;
  desc: string;
  tag: string;
}

const STUDIO_PILLARS: StudioPillar[] = [
  {
    icon: "🌿",
    title: "100% Independent",
    desc: "No paywalls, subscriptions, or corporate bloat. Free forever.",
    tag: "Free & Open",
  },
  {
    icon: "🛡️",
    title: "Private By Design",
    desc: "Runs 100% in your browser. Your photos never touch a cloud server.",
    tag: "Client-Side Only",
  },
  {
    icon: "🌸",
    title: "Lossless 1080×1920",
    desc: "Pixel-perfect cutout detection and uncompressed HD PNG export.",
    tag: "Retina Story Output",
  },
];

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

  // Direct DOM refs for 0ms latency hardware updates (no React re-renders)
  const progressBarRef = useRef<HTMLDivElement>(null);
  const petalParallaxRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const categoryOverlayRef = useRef<HTMLDivElement>(null);
  const transitionPromptRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Frame cache
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Scrub engine values
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const rafHandleRef = useRef<number | null>(null);
  const lastRenderedIndexRef = useRef<number>(-1);

  // Discrete state tracker refs
  const currentChapterRef = useRef<number>(0);
  const currentCategoryRef = useRef<number>(0);

  // Viewport & device detection
  const laidOutWRef = useRef<number>(0);
  const isCoarsePointerRef = useRef<boolean>(false);
  const reduceMotionRef = useRef<boolean>(false);

  // React state (strictly for low-frequency discrete UI updates)
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);

  // ============================================================================
  // STEP 1: Preload frame 1 immediately, then stream remaining frames in background
  // ============================================================================
  useEffect(() => {
    let isMounted = true;
    let loadedCount = 0;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    if (typeof window !== "undefined") {
      isCoarsePointerRef.current = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
      reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      laidOutWRef.current = window.innerWidth;

      // On mobile viewports, skip desktop 300-frame progressive downloads entirely
      if (window.innerWidth < 768) {
        return;
      }
    }

    imagesRef.current = images;

    // Watchdog safety fallback: ensure preloader dismisses even on poor mobile connectivity
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoaded(true);
      }
    }, 2000);

    // Load Frame 1 with high priority
    const firstImg = new Image();
    images[0] = firstImg;

    const onFirstFrameReady = () => {
      if (!isMounted) return;
      clearTimeout(safetyTimer);
      loadedCount++;
      setLoadProgress(Math.floor((loadedCount / TOTAL_FRAMES) * 100));

      // Make hero and scrolling interactive immediately!
      setIsLoaded(true);
      handleResize();
      drawFrame(0);

      // Progressively load remaining frames 2..300 in the background
      loadRemainingFrames();
    };

    firstImg.onload = onFirstFrameReady;
    firstImg.onerror = onFirstFrameReady; // Fallback so page never hangs
    firstImg.src = "/sakura-frames/ezgif-frame-001.webp";

    if (firstImg.complete) {
      onFirstFrameReady();
    }

    // Background progressive loader for frames 2..300
    const loadRemainingFrames = () => {
      for (let i = 2; i <= TOTAL_FRAMES; i++) {
        const index = i - 1;
        const padIndex = String(i).padStart(3, "0");
        const img = new Image();

        const onFrameLoaded = () => {
          if (!isMounted) return;
          loadedCount++;
          setLoadProgress(Math.floor((loadedCount / TOTAL_FRAMES) * 100));
        };

        img.onload = onFrameLoaded;
        img.onerror = onFrameLoaded;
        img.src = `/sakura-frames/ezgif-frame-${padIndex}.webp`;
        images[index] = img;

        if (img.complete) {
          onFrameLoaded();
        }
      }
    };

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // ============================================================================
  // STEP 2: Draw frame with aspect ratio cover
  // ============================================================================
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));
    let img = imagesRef.current[clampedIndex];

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

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    lastRenderedIndexRef.current = clampedIndex;
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x DPR for buttery performance
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
  // STEP 3: Ultra-low latency Direct DOM updates (No React state churn)
  // ============================================================================
  const updateDOMOverlays = (progress: number) => {
    // 1. Progress bar scale
    if (progressBarRef.current) {
      progressBarRef.current.style.transform = `scaleX(${progress})`;
    }

    // 2. Petals parallax
    if (petalParallaxRef.current) {
      petalParallaxRef.current.style.transform = `translate3d(0, ${-progress * 60}px, 0)`;
    }

    // 3. Wordmark (0.0 to 0.15)
    if (wordmarkRef.current) {
      const op = progress <= 0.08 ? 1 : progress <= 0.16 ? 1 - (progress - 0.08) / 0.08 : 0;
      wordmarkRef.current.style.opacity = String(op);
      wordmarkRef.current.style.transform = `translateY(${(1 - op) * -20}px)`;
      wordmarkRef.current.style.pointerEvents = op > 0.1 ? "auto" : "none";
    }

    // 4. Independent Studio Section (0.28 to 0.72)
    if (categoryOverlayRef.current) {
      const isCatActive = progress >= 0.28 && progress <= 0.72;
      categoryOverlayRef.current.style.opacity = isCatActive ? "1" : "0";
      categoryOverlayRef.current.style.pointerEvents = isCatActive ? "auto" : "none";

      if (isCatActive) {
        // Dynamic entrance fan-out (0.28 to 0.38) and exit fan-out (0.62 to 0.72)
        let spread = 0;
        if (progress < 0.38) {
          const entrance = Math.min(1, Math.max(0, (progress - 0.28) / 0.10));
          spread = 1 - entrance;
        } else if (progress > 0.62) {
          const exit = Math.min(1, Math.max(0, (progress - 0.62) / 0.10));
          spread = exit;
        }

        // Subtle 3D perspective fan-out and depth on the 3 glass cards
        pillRefs.current.slice(0, 3).forEach((pill, idx) => {
          if (!pill) return;
          const dist = idx - 1; // -1 (left), 0 (center), 1 (right)

          const x = dist * 28 * spread;
          const y = Math.abs(dist) * 8 * spread;
          const rotZ = dist * 3.5 * spread;
          const rotY = -dist * 8 * spread;
          const scale = 1 - 0.04 * spread;

          pill.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotateZ(${rotZ.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        });
      }
    }

    // 5. Transition Prompt (0.80 to 0.94)
    if (transitionPromptRef.current) {
      const isPromptActive = progress >= 0.80 && progress < 0.94;
      transitionPromptRef.current.style.opacity = isPromptActive ? "1" : "0";
      transitionPromptRef.current.style.pointerEvents = isPromptActive ? "auto" : "none";
    }

    // 6. Chapter Dots
    let chIdx = 0;
    for (let i = 0; i < CHAPTERS.length; i++) {
      if (progress >= CHAPTERS[i].progress - 0.08) {
        chIdx = i;
      }
    }
    if (chIdx !== currentChapterRef.current) {
      currentChapterRef.current = chIdx;
      setActiveChapterIndex(chIdx);
    }
  };

  // ============================================================================
  // STEP 4: On-Demand RAF Loop (Zero CPU when idle)
  // ============================================================================
  useEffect(() => {
    if (!isLoaded) return;

    handleResize();
    drawFrame(0);

    const tick = () => {
      const reduce = reduceMotionRef.current;
      const target = targetProgressRef.current;
      let current = currentProgressRef.current;

      const delta = target - current;

      if (Math.abs(delta) > LERP_EPSILON) {
        current += delta * (reduce ? 1 : LERP_FACTOR);
        currentProgressRef.current = current;
      } else {
        current = target;
        currentProgressRef.current = target;
      }

      // Render frame
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

      // Update styles directly on DOM
      updateDOMOverlays(current);

      // Stop RAF when motion has completely settled
      if (Math.abs(target - current) <= LERP_EPSILON) {
        rafHandleRef.current = null;
        return;
      }

      rafHandleRef.current = requestAnimationFrame(tick);
    };

    const startTickIfNeeded = () => {
      if (rafHandleRef.current === null) {
        rafHandleRef.current = requestAnimationFrame(tick);
      }
    };

    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScrollableDistance = rect.height - window.innerHeight;
      if (totalScrollableDistance <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.min(1, Math.max(0, currentScroll / totalScrollableDistance));
      targetProgressRef.current = progress;

      startTickIfNeeded();
    };

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
        rafHandleRef.current = null;
      }
    };
  }, [isLoaded]);

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
      {/* HAIRLINE FLIGHT PROGRESS BAR (Direct DOM transform - Desktop)      */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden md:block fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-dustyPink/20">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-dustyMauve via-peachPink to-blushWhite origin-left will-change-transform transform-gpu shadow-[0_0_12px_rgba(226,180,189,0.8)]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FIXED POSITION BACKGROUND CANVAS (HOMEPAGE DESKTOP ONLY)           */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden md:block fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <canvas ref={canvasRef} className="w-full h-full object-cover block will-change-transform transform-gpu" />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ATMOSPHERIC DEPTH & DRIFTING PETALS LAYER (Desktop)                */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden md:block fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-b from-peachPink/15 via-dustyMauve/10 to-transparent blur-3xl animate-ambient-glow" />
        <div className="absolute -bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-t from-dustyMauve/10 to-transparent blur-3xl pointer-events-none" />

        {/* Petals container with direct DOM parallax */}
        <div ref={petalParallaxRef} className="absolute inset-0 will-change-transform transform-gpu">
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
      {/* FIXED DARK OVERLAY (bg-black/25 - Desktop)                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden md:block fixed inset-0 bg-black/25 pointer-events-none z-[2]" />

      {/* ------------------------------------------------------------------ */}
      {/* CHAPTER ROUTE INDICATOR (Desktop Only)                             */}
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
      {/* PRELOADER SCREEN (Desktop Only)                                    */}
      {/* ------------------------------------------------------------------ */}
      {!isLoaded && (
        <div className="hidden md:flex fixed inset-0 z-50 flex-col items-center justify-center bg-charcoal text-blushWhite px-6">
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
      {/* 300VH SCROLL TRACKER & OVERLAYS CONTAINER (Desktop Only)           */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={containerRef}
        className="hidden md:block relative z-10 w-full h-[300vh] selection:bg-dustyMauve selection:text-charcoal pointer-events-none"
      >
        <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center pointer-events-none">
          {/* OVERLAY 1: Brand Wordmark (Direct DOM Opacity & Translate) */}
          <div
            ref={wordmarkRef}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 will-change-transform transform-gpu"
            style={{ opacity: 1, transform: "translateY(0px)" }}
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

          {/* OVERLAY 2: Bespoke Studio Signature & Philosophy */}
          <div
            ref={categoryOverlayRef}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 will-change-transform transform-gpu"
            style={{ opacity: 0, pointerEvents: "none" }}
          >
            <div className="max-w-4xl flex flex-col items-center">
              {/* Glassmorphic Eyebrow Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-1.5 rounded-full bg-[#181316]/75 border border-white/20 backdrop-blur-xl mb-4 shadow-xl">
                <Sparkles className="w-3.5 h-3.5 text-peachPink animate-pulse" />
                <span className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-peachPink font-semibold">
                  ✦ INDEPENDENT STUDIO &middot; 桜の工房 ✦
                </span>
              </div>

              {/* Author / Creator Headline */}
              <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] text-blushWhite font-normal tracking-tight mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] max-w-2xl leading-[1.18]">
                A bespoke story editor, <br className="hidden sm:inline" />
                <span className="italic text-peachPink font-medium">made by Aftab Kathat.</span>
              </h2>

              {/* Signature Philosophy Quote */}
              <p className="font-poppins text-sm sm:text-base text-blushWhite/80 italic font-light tracking-wide max-w-lg mb-8 drop-shadow-md">
                &ldquo;Every memory deserves a beautiful frame.&rdquo;
              </p>

              {/* 3 Glassmorphic Pillars */}
              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5 w-full max-w-3xl pointer-events-auto"
                style={{ perspective: "1000px" }}
              >
                {STUDIO_PILLARS.map((pillar, idx) => (
                  <div
                    key={pillar.title}
                    ref={(el) => {
                      pillRefs.current[idx] = el as any;
                    }}
                    className="group relative rounded-2xl p-5 bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-white/[0.02] border border-white/20 hover:border-peachPink/60 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] transition-all duration-300 hover:bg-white/[0.16] hover:-translate-y-1.5 flex flex-col items-center text-center overflow-hidden will-change-transform transform-gpu"
                  >
                    {/* Top edge specular reflection sheen */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                    {/* Glowing radial ambient background */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-peachPink/15 blur-xl pointer-events-none group-hover:bg-peachPink/25 transition-colors" />

                    {/* Icon Bubble */}
                    <div className="relative w-11 h-11 rounded-xl bg-white/[0.08] border border-white/20 flex items-center justify-center text-xl mb-3 shadow-inner group-hover:scale-110 transition-transform">
                      {pillar.icon}
                    </div>

                    {/* Title */}
                    <h3 className="relative font-playfair text-base sm:text-lg font-bold text-blushWhite tracking-wide mb-1.5 group-hover:text-cream transition-colors">
                      {pillar.title}
                    </h3>

                    {/* Description */}
                    <p className="relative font-poppins text-xs text-blushWhite/75 font-light leading-relaxed mb-3">
                      {pillar.desc}
                    </p>

                    {/* Micro Pill Tag */}
                    <span className="relative mt-auto inline-block text-[10px] font-mono tracking-widest uppercase text-peachPink/90 bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-white/10">
                      {pillar.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* OVERLAY 3: Transition Prompt */}
          <div
            ref={transitionPromptRef}
            className="absolute bottom-12 z-20 flex flex-col items-center text-center will-change-transform transform-gpu"
            style={{ opacity: 0, pointerEvents: "none" }}
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
