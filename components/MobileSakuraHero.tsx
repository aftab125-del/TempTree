"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";

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
  tone: "peach" | "mauve" | "blush";
}

const MOBILE_PETALS: PetalParticle[] = [
  { id: 1, left: 10, top: 12, scale: 0.85, driftX: 25, rot: 180, duration: 14, delay: 0, opacity: 0.65, tone: "peach" },
  { id: 2, left: 26, top: 42, scale: 1.1, driftX: -30, rot: 220, duration: 18, delay: 1.5, opacity: 0.5, tone: "mauve" },
  { id: 3, left: 48, top: 78, scale: 0.75, driftX: 35, rot: 160, duration: 13, delay: 3.2, opacity: 0.7, tone: "blush" },
  { id: 4, left: 68, top: 22, scale: 1.0, driftX: -25, rot: 190, duration: 19, delay: 0.8, opacity: 0.6, tone: "peach" },
  { id: 5, left: 82, top: 62, scale: 0.8, driftX: 30, rot: 240, duration: 16, delay: 4.0, opacity: 0.55, tone: "mauve" },
  { id: 6, left: 16, top: 86, scale: 0.9, driftX: -20, rot: 150, duration: 15, delay: 2.1, opacity: 0.65, tone: "blush" },
  { id: 7, left: 88, top: 32, scale: 0.95, driftX: 28, rot: 200, duration: 17, delay: 1.2, opacity: 0.6, tone: "peach" },
  { id: 8, left: 52, top: 10, scale: 0.7, driftX: -35, rot: 170, duration: 14, delay: 5.0, opacity: 0.65, tone: "mauve" },
];

const MOBILE_STUDIO_PILLARS = [
  {
    icon: "🌿",
    title: "100% Free & Open",
    desc: "No paywalls, subscriptions, or corporate bloat.",
  },
  {
    icon: "🛡️",
    title: "Client-Side Privacy",
    desc: "Your photos never touch a cloud server.",
  },
  {
    icon: "🌸",
    title: "Lossless 1080×1920",
    desc: "Pixel-perfect cutout slots & retina PNG export.",
  },
];

export default function MobileSakuraHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const phase1Ref = useRef<HTMLDivElement>(null);
  const phase2Ref = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    const updateScrollProgress = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      const progress = Math.min(1, Math.max(0, -rect.top / totalScrollable));

      // Phase 1: Brand Wordmark (visible from 0 to ~0.4, fades out up to 0.48)
      if (phase1Ref.current) {
        const op1 = progress <= 0.2 ? 1 : Math.max(0, 1 - (progress - 0.2) / 0.25);
        phase1Ref.current.style.opacity = String(op1);
        phase1Ref.current.style.transform = `translate3d(0, ${(1 - op1) * -22}px, 0)`;
        phase1Ref.current.style.pointerEvents = op1 > 0.2 ? "auto" : "none";
      }

      // Phase 2: Bespoke Studio Card (fades in from 0.35 to 0.65, stays until 1.0)
      if (phase2Ref.current) {
        const op2 = progress <= 0.35 ? 0 : Math.min(1, (progress - 0.35) / 0.25);
        phase2Ref.current.style.opacity = String(op2);
        phase2Ref.current.style.transform = `translate3d(0, ${(1 - op2) * 20}px, 0)`;
        phase2Ref.current.style.pointerEvents = op2 > 0.2 ? "auto" : "none";
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const scrollToExamples = () => {
    const el = document.getElementById("examples");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[120vh] selection:bg-dustyMauve selection:text-charcoal"
    >
      {/* Sticky Fullscreen Mobile Viewport Container */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
        {/* 1. Settled Sakura Bloom Still Visual (Frame 300 - Instant Load) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <img
            src="/sakura-frames/ezgif-frame-300.webp"
            alt="TempTree Sakura Full Bloom"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover object-center transform scale-105 transition-opacity duration-700 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
          {/* Contrast tint on settled bloom */}
          <div className="absolute inset-0 bg-[#181318]/40" />
        </div>

        {/* 2. Atmospheric Ambient Radial Palette Glows */}
        <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
          <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[380px] h-[380px] rounded-full bg-gradient-to-b from-[#F7D6D0]/20 via-[#E2B4BD]/12 to-transparent blur-3xl animate-ambient-glow" />
          <div className="absolute -bottom-[10%] right-[-10%] w-[320px] h-[320px] rounded-full bg-gradient-to-t from-[#E2B4BD]/15 to-transparent blur-3xl" />
        </div>

        {/* 3. Floating SVG Sakura Petals (Continuous Living Motion) */}
        <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden" aria-hidden="true">
          {MOBILE_PETALS.map((petal) => (
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
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className={`drop-shadow-[0_2px_6px_rgba(226,180,189,0.4)] ${
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
                  fillOpacity="0.85"
                />
              </svg>
            </div>
          ))}
        </div>

        {/* 4. Contrast Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#150f14]/85 pointer-events-none z-[3]" />

        {/* 5. Bottom Blend Gradient into Post-Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#150f14] to-transparent pointer-events-none z-[4]" />

        {/* OVERLAY PHASE 1: Main Brand Headline & Instant Action CTA */}
        <div
          ref={phase1Ref}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-5 will-change-transform transform-gpu pointer-events-auto"
          style={{ opacity: 1, transform: "translate3d(0, 0px, 0)" }}
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181316]/85 border border-dustyMauve/40 backdrop-blur-md mb-4 shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-peachPink animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.24em] text-blushWhite font-medium">
              Aesthetic Story Studio
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-playfair text-6xl sm:text-7xl font-extrabold text-blushWhite tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            TempTree
          </h1>

          <p className="font-poppins text-lg text-blushWhite/95 font-light tracking-wide max-w-xs mt-3 drop-shadow-md">
            Find your aesthetic.
          </p>

          <p className="font-poppins text-[10px] uppercase tracking-[0.28em] text-peachPink mt-2 font-medium">
            Instagram Story Templates &middot; 1080 &times; 1920
          </p>

          {/* Direct Mobile Action Button */}
          <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-xs">
            <Link
              href="/gallery"
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-peachPink text-charcoal font-bold text-sm shadow-xl hover:bg-cream active:scale-95 transition-all group"
            >
              <span>Upload Frame &amp; Edit</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={scrollToExamples}
              className="inline-flex items-center gap-1.5 text-xs text-blushWhite/75 hover:text-blushWhite pt-2 transition-colors cursor-pointer"
            >
              <span>Scroll to explore</span>
              <ArrowDown className="w-3.5 h-3.5 text-peachPink animate-bounce" />
            </button>
          </div>
        </div>

        {/* OVERLAY PHASE 2: Bespoke Studio Signature & Philosophy Card */}
        <div
          ref={phase2Ref}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 will-change-transform transform-gpu pointer-events-none"
          style={{ opacity: 0, transform: "translate3d(0, 20px, 0)" }}
        >
          <div className="w-full max-w-sm rounded-2xl p-5 bg-[#181316]/90 border border-white/20 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col items-center text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 mb-3">
              <Sparkles className="w-3 h-3 text-peachPink" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-peachPink font-semibold">
                ✦ INDEPENDENT STUDIO ✦
              </span>
            </div>

            {/* Headline */}
            <h2 className="font-playfair text-2xl font-bold text-blushWhite tracking-tight mb-1 leading-snug">
              A bespoke story editor, <br />
              <span className="italic text-peachPink font-normal">made by Aftab Kathat.</span>
            </h2>

            <p className="font-poppins text-xs text-blushWhite/75 italic font-light mb-4">
              &ldquo;Every memory deserves a beautiful frame.&rdquo;
            </p>

            {/* 3 Compact Mobile Pillars */}
            <div className="w-full flex flex-col gap-2 mb-4 text-left">
              {MOBILE_STUDIO_PILLARS.map((pillar) => (
                <div
                  key={pillar.title}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.05] border border-white/10"
                >
                  <span className="text-base shrink-0">{pillar.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-cream leading-tight">
                      {pillar.title}
                    </p>
                    <p className="text-[10px] text-blushWhite/60 font-light truncate">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick action strip */}
            <button
              onClick={scrollToExamples}
              className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs uppercase tracking-[0.18em] text-cream font-medium transition-colors cursor-pointer"
            >
              Browse Templates &darr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
