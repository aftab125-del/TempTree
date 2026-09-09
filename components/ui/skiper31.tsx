"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Palette, Camera, Heart, Film, Wand2, Compass } from "lucide-react";

type CharacterProps = {
  char: string;
  index: number;
  centerIndex: number;
  progress: MotionValue<number>;
  colorClass?: string;
};

type ItemProps = {
  item: {
    label: string;
    sublabel?: string;
    icon?: React.ReactNode;
  };
  index: number;
  centerIndex: number;
  progress: MotionValue<number>;
};

/**
 * CharacterV1 — 3D perspective letter rotation and x-glide on scroll
 */
const CharacterV1 = React.memo(({
  char,
  index,
  centerIndex,
  progress,
  colorClass = "text-dustyMauve",
}: CharacterProps) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(progress, [0, 0.28], [distanceFromCenter * 40, 0]);
  const rotateX = useTransform(progress, [0, 0.28], [distanceFromCenter * 35, 0]);
  const opacity = useTransform(progress, [0, 0.15], [0.1, 1]);

  return (
    <motion.span
      className={cn(
        "inline-block will-change-transform transform-gpu",
        colorClass,
        isSpace && "w-3 sm:w-5"
      )}
      style={{ x, rotateX, opacity }}
    >
      {char}
    </motion.span>
  );
});
CharacterV1.displayName = "CharacterV1";

/**
 * CharacterV2 — Floating badge cards with upward arch and scale on scroll
 */
const CharacterV2 = React.memo(({
  item,
  index,
  centerIndex,
  progress,
}: ItemProps) => {
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(progress, [0.32, 0.62], [distanceFromCenter * 45, 0]);
  const scale = useTransform(progress, [0.32, 0.62], [0.8, 1]);
  const y = useTransform(progress, [0.32, 0.62], [Math.abs(distanceFromCenter) * 30, 0]);
  const opacity = useTransform(progress, [0.30, 0.45], [0, 1]);

  return (
    <motion.div
      className="inline-flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-charcoal/90 border border-dustyMauve/30 backdrop-blur-md shadow-xl text-blushWhite min-w-[100px] sm:min-w-[125px] will-change-transform transform-gpu"
      style={{ x, scale, y, opacity, transformOrigin: "center" }}
    >
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-dustyMauve/20 border border-peachPink/30 flex items-center justify-center text-peachPink mb-2">
        {item.icon}
      </div>
      <span className="font-playfair text-xs sm:text-base font-bold text-blushWhite">
        {item.label}
      </span>
      {item.sublabel && (
        <span className="font-poppins text-[9px] sm:text-[10px] tracking-wider uppercase text-peachPink/80 mt-0.5">
          {item.sublabel}
        </span>
      )}
    </motion.div>
  );
});
CharacterV2.displayName = "CharacterV2";

/**
 * CharacterV3 — 3D rotation, fan arc, and scale on scroll
 */
const CharacterV3 = React.memo(({
  item,
  index,
  centerIndex,
  progress,
}: ItemProps) => {
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(progress, [0.65, 0.95], [distanceFromCenter * 50, 0]);
  const rotate = useTransform(progress, [0.65, 0.95], [distanceFromCenter * 25, 0]);
  const y = useTransform(progress, [0.65, 0.95], [-Math.abs(distanceFromCenter) * 15, 0]);
  const scale = useTransform(progress, [0.65, 0.95], [0.8, 1]);
  const opacity = useTransform(progress, [0.63, 0.78], [0, 1]);

  return (
    <motion.div
      className="inline-flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-blushWhite text-charcoal border-2 border-peachPink/50 shadow-2xl min-w-[105px] sm:min-w-[130px] will-change-transform transform-gpu"
      style={{ x, rotate, y, scale, opacity, transformOrigin: "center" }}
    >
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-peachPink/40 flex items-center justify-center text-charcoal mb-2 shadow-inner">
        {item.icon}
      </div>
      <span className="font-playfair text-sm sm:text-base font-bold text-charcoal">
        {item.label}
      </span>
      {item.sublabel && (
        <span className="font-poppins text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase text-dustyMauve mt-0.5">
          {item.sublabel}
        </span>
      )}
    </motion.div>
  );
});
CharacterV3.displayName = "CharacterV3";

interface Skiper31Props {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  className?: string;
}

const DEFAULT_ITEMS = [
  { label: "Y2K", sublabel: "Cyber Glow", icon: <Sparkles className="w-4 h-4" /> },
  { label: "Minimal", sublabel: "Serene Void", icon: <Compass className="w-4 h-4" /> },
  { label: "Dreamy", sublabel: "Sakura Haze", icon: <Heart className="w-4 h-4" /> },
  { label: "Vintage", sublabel: "35mm Grain", icon: <Film className="w-4 h-4" /> },
  { label: "Bold", sublabel: "Street Accent", icon: <Wand2 className="w-4 h-4" /> },
  { label: "Editorial", sublabel: "Vogue Frame", icon: <Camera className="w-4 h-4" /> },
  { label: "Studio", sublabel: "Curated Art", icon: <Palette className="w-4 h-4" /> },
];

/**
 * Skiper31 Component
 * -------------------------------------------------------------
 * High-performance, GPU-accelerated scroll motion showcase.
 * Zero layout-thrashing, native scroll compatible (Lenis-free).
 */
const Skiper31: React.FC<Skiper31Props> = ({
  title = "FIND YOUR AESTHETIC",
  subtitle = "Craft bespoke Instagram stories in seconds",
  badgeText = "Aesthetic Motion Dynamics",
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Single unified scroll listener for maximum performance
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const characters = title.split("");
  const centerIndex = Math.floor(characters.length / 2);
  const itemCenterIndex = Math.floor(DEFAULT_ITEMS.length / 2);

  // Stage 1 opacity & transform (0.0 to 0.32)
  const stage1Opacity = useTransform(scrollYProgress, [0, 0.25, 0.32], [1, 1, 0]);
  const stage1Scale = useTransform(scrollYProgress, [0.25, 0.32], [1, 0.95]);

  // Stage 2 opacity & transform (0.33 to 0.65)
  const stage2Opacity = useTransform(scrollYProgress, [0.32, 0.38, 0.58, 0.65], [0, 1, 1, 0]);
  const stage2Scale = useTransform(scrollYProgress, [0.58, 0.65], [1, 0.95]);

  // Stage 3 opacity & transform (0.65 to 1.0)
  const stage3Opacity = useTransform(scrollYProgress, [0.65, 0.72, 1], [0, 1, 1]);

  return (
    <section
      ref={containerRef}
      className={cn("relative w-full h-[260vh] bg-transparent text-charcoal", className)}
    >
      {/* Sticky 100vh viewport pinning all 3 stages */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center pointer-events-none px-4">
        {/* ========================================================= */}
        {/* STAGE 1: 3D Character Wave                                */}
        {/* ========================================================= */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
          style={{
            opacity: stage1Opacity,
            scale: stage1Scale,
            pointerEvents: "auto",
          }}
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-charcoal/80 border border-dustyMauve/30 text-peachPink text-xs font-semibold uppercase tracking-widest backdrop-blur-md shadow-md mb-4">
            <Sparkles className="w-3.5 h-3.5 text-dustyMauve" />
            <span>{badgeText}</span>
          </span>

          <p className="font-poppins text-xs sm:text-sm text-blushWhite/80 uppercase tracking-widest font-light mb-4">
            Scroll down to assemble
          </p>

          <div
            className="w-full max-w-5xl text-center text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-playfair font-extrabold tracking-tight drop-shadow-2xl text-blushWhite"
            style={{ perspective: "600px" }}
          >
            {characters.map((char, index) => (
              <CharacterV1
                key={index}
                char={char}
                index={index}
                centerIndex={centerIndex}
                progress={scrollYProgress}
                colorClass={index % 2 === 0 ? "text-blushWhite" : "text-dustyMauve"}
              />
            ))}
          </div>

          <p className="font-poppins text-xs sm:text-base text-peachPink/90 font-light tracking-wide mt-4 max-w-md text-center">
            {subtitle}
          </p>
        </motion.div>

        {/* ========================================================= */}
        {/* STAGE 2: Gliding Aesthetic Badges (Arch)                  */}
        {/* ========================================================= */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 gap-6"
          style={{
            opacity: stage2Opacity,
            scale: stage2Scale,
            pointerEvents: "auto",
          }}
        >
          <div className="flex items-center justify-center gap-3 text-center">
            <Bracket className="h-6 sm:h-9 text-peachPink" />
            <span className="font-playfair text-xl sm:text-3xl font-semibold text-blushWhite drop-shadow-md">
              Five signature moods, endless canvas possibilities
            </span>
            <Bracket className="h-6 sm:h-9 scale-x-[-1] text-peachPink" />
          </div>

          <div className="w-full max-w-5xl flex flex-wrap items-center justify-center gap-3 sm:gap-5 py-4">
            {DEFAULT_ITEMS.map((item, index) => (
              <CharacterV2
                key={item.label}
                item={item}
                index={index}
                centerIndex={itemCenterIndex}
                progress={scrollYProgress}
              />
            ))}
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* STAGE 3: Fan-Out Cards (3D Fan & Scale)                   */}
        {/* ========================================================= */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 gap-6"
          style={{
            opacity: stage3Opacity,
            pointerEvents: "auto",
          }}
        >
          <div className="flex items-center justify-center gap-3 text-center">
            <Bracket className="h-6 sm:h-9 text-dustyMauve" />
            <span className="font-playfair text-xl sm:text-3xl font-semibold text-blushWhite drop-shadow-md">
              Ready to publish straight to Instagram Stories
            </span>
            <Bracket className="h-6 sm:h-9 scale-x-[-1] text-dustyMauve" />
          </div>

          <div
            className="w-full max-w-5xl flex flex-wrap items-center justify-center gap-3 sm:gap-5 py-4"
            style={{ perspective: "800px" }}
          >
            {DEFAULT_ITEMS.map((item, index) => (
              <CharacterV3
                key={item.label}
                item={item}
                index={index}
                centerIndex={itemCenterIndex}
                progress={scrollYProgress}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export { CharacterV1, CharacterV2, CharacterV3, Skiper31 };

const Bracket = ({ className }: { className: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 27 78"
      className={className}
    >
      <path
        fill="currentColor"
        d="M26.52 77.21h-5.75c-6.83 0-12.38-5.56-12.38-12.38V48.38C8.39 43.76 4.63 40 .01 40v-4c4.62 0 8.38-3.76 8.38-8.38V12.4C8.38 5.56 13.94 0 20.77 0h5.75v4h-5.75c-4.62 0-8.38 3.76-8.38 8.38V27.6c0 4.34-2.25 8.17-5.64 10.38 3.39 2.21 5.64 6.04 5.64 10.38v16.45c0 4.62 3.76 8.38 8.38 8.38h5.75v4.02Z"
      />
    </svg>
  );
};
