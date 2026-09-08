"use client";

import React, { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/types/template";
import { ArrowDown, Sparkles } from "lucide-react";

/**
 * SakuraScrollHero Component
 * -------------------------------------------------------------
 * This component orchestrates an interactive 300-frame video scrub
 * rendered onto an HTML5 <canvas> element synchronized with user scrolling.
 *
 * How it works (for beginners following along):
 * 1. Preloading: Instead of requesting 300 frames on-the-fly, we load all
 *    300 PNG images into JavaScript Image() objects in memory on mount.
 *    A progress indicator (0% to 100%) keeps the user informed.
 * 2. Canvas Sizing & High-DPI: We scale the canvas by `window.devicePixelRatio`
 *    so graphics look razor-sharp on Retina / 4K displays.
 * 3. Throttled Scroll Tracking: Scroll events fire dozens of times per second.
 *    Using `requestAnimationFrame` ensures we only compute and draw when
 *    the browser is ready for the next screen refresh (typically 60Hz or 120Hz).
 * 4. Frame Mapping: `scrollProgress` (0.0 to 1.0) maps linearly to index 0..299:
 *    `frameIndex = Math.floor(scrollProgress * 299)`.
 * 5. Ghosting Prevention: `ctx.clearRect(0, 0, width, height)` cleans the frame
 *    buffer before each `drawImage` call.
 * 6. Aspect-Ratio Cover: We calculate `offsetX` / `offsetY` so the animation
 *    fills the screen like CSS `object-fit: cover` regardless of viewport aspect ratio.
 */

const TOTAL_FRAMES = 300;

export default function SakuraScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // In-memory array storing preloaded HTMLImageElement instances
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // RAF (RequestAnimationFrame) handle ref to prevent redundant draws
  const rafIdRef = useRef<number | null>(null);

  // Loading state
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Normalized scroll progress through the 300vh container (0.0 to 1.0)
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Last rendered frame index to avoid re-drawing the identical frame
  const lastRenderedIndexRef = useRef<number>(-1);

  // ============================================================================
  // STEP 1: Preload all 300 frames on mount
  // ============================================================================
  useEffect(() => {
    let isMounted = true;
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    // Preload loop: ezgif-frame-001.png ... ezgif-frame-300.png
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const padIndex = String(i).padStart(3, "0");
      const img = new Image();
      img.src = `/sakura-frames/ezgif-frame-${padIndex}.png`;

      const handleImageLoadOrError = () => {
        if (!isMounted) return;
        loadedCount++;
        const pct = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        setLoadProgress(pct);

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
    const img = imagesRef.current[clampedIndex];

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Aspect-ratio cover math:
    // Scale image so it completely covers the canvas without letterboxing
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      // Screen is wider than image: fit width and crop top/bottom
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      // Screen is taller than image: fit height and crop sides
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
    }

    // Clear previous frame to prevent ghosting / artifacts
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw current frame centered
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    lastRenderedIndexRef.current = clampedIndex;
  };

  // Resize canvas according to viewport dimensions & device pixel ratio
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

    // Re-draw current frame after resize
    const targetFrame = Math.floor(scrollProgress * (TOTAL_FRAMES - 1));
    drawFrame(targetFrame);
  };

  // ============================================================================
  // STEP 3: Throttled Scroll Listener (RequestAnimationFrame)
  // ============================================================================
  useEffect(() => {
    if (!isLoaded) return;

    // Initial resize and frame 0 render
    handleResize();
    drawFrame(0);

    const updateScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScrollableDistance = rect.height - window.innerHeight;

      if (totalScrollableDistance <= 0) return;

      // Calculate progress from 0.0 (top of container) to 1.0 (bottom of container)
      const currentScroll = -rect.top;
      const progress = Math.min(1, Math.max(0, currentScroll / totalScrollableDistance));

      setScrollProgress(progress);

      const targetFrame = Math.floor(progress * (TOTAL_FRAMES - 1));
      if (targetFrame !== lastRenderedIndexRef.current) {
        drawFrame(targetFrame);
      }

      rafIdRef.current = null;
    };

    const handleScroll = () => {
      // Throttle with requestAnimationFrame: only compute next frame when browser is ready
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(updateScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isLoaded]);

  // ============================================================================
  // Overlay Visibility Calculations (Driven purely by scrollProgress)
  // ============================================================================

  // 1. Wordmark & Tagline: Active 0% to 12% (Fades out by 15%)
  const wordmarkOpacity =
    scrollProgress <= 0.08
      ? 1
      : scrollProgress <= 0.15
      ? 1 - (scrollProgress - 0.08) / 0.07
      : 0;

  // 2. Category Names: Active 35% to 65% (Fades in one at a time)
  // We have 5 categories: Y2K (35-41%), Minimal (41-47%), Dreamy (47-53%), Vintage (53-59%), Bold (59-65%)
  const isCategorySectionActive = scrollProgress >= 0.32 && scrollProgress <= 0.70;
  const categoryProgress = Math.min(
    1,
    Math.max(0, (scrollProgress - 0.34) / (0.66 - 0.34))
  );
  // Active category index: 0, 1, 2, 3, or 4
  const activeCategoryIndex = Math.min(
    CATEGORIES.length - 1,
    Math.floor(categoryProgress * CATEGORIES.length)
  );

  // 3. Hero Canvas Fadeout: 90% to 100% transitions into gallery preview below
  const heroOpacity =
    scrollProgress >= 0.9
      ? Math.max(0, 1 - (scrollProgress - 0.9) / 0.1)
      : 1;

  const scrollToGallery = () => {
    const container = containerRef.current;
    if (!container) return;
    const targetScroll = container.offsetTop + container.offsetHeight - window.innerHeight + 50;
    window.scrollTo({ top: targetScroll, behavior: "smooth" });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[300vh] bg-plum selection:bg-mauve selection:text-cream"
    >
      {/* Pinned Viewport Container (Sticky 100vh) */}
      <div
        className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center pointer-events-none"
        style={{ opacity: heroOpacity, transition: "opacity 0.1s linear" }}
      >
        {/* Background Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover block"
        />

        {/* Soft Vignette / Gradient Overlay for High Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-plum/50 via-transparent to-plum/80 pointer-events-none" />

        {/* ------------------------------------------------------------------ */}
        {/* PRELOADER SCREEN (Shown while loading 300 frames) */}
        {/* ------------------------------------------------------------------ */}
        {!isLoaded && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-plum text-cream px-6">
            <div className="flex items-center space-x-3 mb-6 animate-pulse">
              <Sparkles className="w-8 h-8 text-dustyPink" />
              <h1 className="font-playfair text-4xl sm:text-5xl font-bold tracking-wider">
                TempTree
              </h1>
            </div>

            <p className="font-poppins text-sm uppercase tracking-widest text-dustyPink/80 mb-6 text-center">
              Gathering sakura blossoms & frames...
            </p>

            {/* Progress bar */}
            <div className="w-64 max-w-full h-2 bg-plum-dark/80 rounded-full overflow-hidden border border-dustyPink/30 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-dustyPink via-mauve to-cream rounded-full transition-all duration-150 ease-out"
                style={{ width: `${loadProgress}%` }}
              />
            </div>

            <span className="font-poppins text-xs font-semibold text-cream mt-3">
              {loadProgress}% loaded
            </span>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* OVERLAY 1: Brand Wordmark + Tagline (0% - 10% scroll progress) */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 transition-all duration-300"
          style={{
            opacity: wordmarkOpacity,
            transform: `translateY(${(1 - wordmarkOpacity) * -20}px)`,
            pointerEvents: wordmarkOpacity > 0.1 ? "auto" : "none",
          }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-plum/60 border border-dustyPink/40 backdrop-blur-md mb-4 shadow-lg shadow-plum/50">
            <Sparkles className="w-4 h-4 text-dustyPink animate-pulse" />
            <span className="text-xs uppercase tracking-[0.25em] text-cream font-medium">
              Aesthetic Story Studio
            </span>
          </div>

          <h1 className="font-playfair text-6xl sm:text-8xl md:text-9xl font-extrabold text-cream tracking-tight drop-shadow-2xl">
            TempTree
          </h1>

          <p className="font-poppins text-lg sm:text-2xl text-cream/90 font-light tracking-wide max-w-md mt-4 drop-shadow-md">
            Find your aesthetic.
          </p>

          <p className="font-poppins text-xs uppercase tracking-[0.3em] text-dustyPink mt-2 font-medium">
            Instagram Story Templates &middot; 1080 &times; 1920
          </p>

          {/* Scroll Prompt Button */}
          <button
            onClick={scrollToGallery}
            className="mt-12 flex flex-col items-center gap-2 text-cream/80 hover:text-cream transition-colors duration-300 group cursor-pointer"
            aria-label="Scroll to explore"
          >
            <span className="text-xs uppercase tracking-widest font-light">
              Scroll to explore
            </span>
            <div className="w-8 h-8 rounded-full border border-cream/40 flex items-center justify-center group-hover:border-cream group-hover:bg-cream/10 transition-all duration-300">
              <ArrowDown className="w-4 h-4 text-cream animate-bounce" />
            </div>
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* OVERLAY 2: Category Names Reveal (35% - 65% scroll progress) */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 transition-all duration-300"
          style={{
            opacity: isCategorySectionActive ? 1 : 0,
            pointerEvents: isCategorySectionActive ? "auto" : "none",
          }}
        >
          <div className="max-w-xl flex flex-col items-center">
            <span className="text-xs uppercase tracking-[0.3em] text-dustyPink font-semibold mb-3 px-3 py-1 rounded-full bg-plum/70 border border-dustyPink/30 backdrop-blur-md">
              Curated Dimensions
            </span>

            <h2 className="font-playfair text-3xl sm:text-4xl text-cream/80 font-normal italic mb-6">
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
                        ? "scale-125 bg-cream text-plum font-bold shadow-xl shadow-plum/60 border-2 border-cream ring-4 ring-mauve/40"
                        : "scale-95 bg-plum/70 text-cream/60 border border-dustyPink/30 backdrop-blur-sm"
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
            <div className="mt-8 text-cream font-poppins text-xs sm:text-sm tracking-wide bg-plum/80 border border-dustyPink/30 px-6 py-2.5 rounded-full backdrop-blur-md shadow-lg max-w-md">
              {activeCategoryIndex === 0 && "★ Y2K: Chrome stars, cyber nostalgia, and bold vibrant glow."}
              {activeCategoryIndex === 1 && "◇ Minimal: Timeless editorial typography with serene white space."}
              {activeCategoryIndex === 2 && "🌸 Dreamy: Ethereal sakura gradients, soft blush & glowing quotes."}
              {activeCategoryIndex === 3 && "🎞 Vintage: Nostalgic Polaroid borders, 35mm film grain & retro dates."}
              {activeCategoryIndex === 4 && "⚡ Bold: High-impact streetwear contrast & powerful headline blocks."}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* OVERLAY 3: Transition Hint (80% - 90% scroll progress) */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="absolute bottom-12 z-20 flex flex-col items-center text-center transition-all duration-300"
          style={{
            opacity: scrollProgress >= 0.78 && scrollProgress < 0.9 ? 1 : 0,
          }}
        >
          <span className="text-xs uppercase tracking-[0.25em] text-cream bg-plum/80 border border-dustyPink/40 px-4 py-2 rounded-full backdrop-blur-md">
            Scroll down to browse templates &darr;
          </span>
        </div>
      </div>
    </div>
  );
}
