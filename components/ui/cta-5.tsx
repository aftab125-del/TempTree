"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CTA5Props {
  badge?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonHref?: string;
  className?: string;
}

export const CTA5: React.FC<CTA5Props> = ({
  badge = "MOTION & BLOSSOM",
  title = "Transform any frame into a breathtaking Instagram Story.",
  subtitle = "Zero design skills needed. Drop in your favorite photo frame, let our smart engine auto-detect the slots, and export in full 1080×1920 HD.",
  buttonText = "Upload Your Frame",
  buttonHref = "/gallery",
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tilt tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springConfig);
  const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className={cn("w-full max-w-5xl mx-auto px-4 py-16 text-center", className)}>
      {/* SVG ClipPath Definition for Rounded Stepped Mask */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="cta5-stepped-mask" clipPathUnits="objectBoundingBox">
            <path d="M 0.0400 0.0000 H 0.9600 A 0.0400 0.0667 0 0 1 1.0000 0.0667 V 0.6333 A 0.0400 0.0667 0 0 1 0.9600 0.7000 H 0.7200 A 0.0400 0.0667 0 0 0 0.6800 0.7667 V 0.8667 A 0.0400 0.0667 0 0 1 0.6400 0.9333 H 0.3600 A 0.0400 0.0667 0 0 1 0.3200 0.8667 V 0.7667 A 0.0400 0.0667 0 0 0 0.2800 0.7000 H 0.0400 A 0.0400 0.0667 0 0 1 0.0000 0.6333 V 0.0667 A 0.0400 0.0667 0 0 1 0.0400 0.0000 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* 1. Masked Rotating 3D Sakura Hero Display */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full max-w-3xl mx-auto aspect-[16/10] sm:aspect-[16/9.5] select-none cursor-pointer filter drop-shadow-[0_20px_50px_rgba(226,180,189,0.25)]"
      >
        {/* Masked Content Container */}
        <div
          className="relative w-full h-full overflow-hidden"
          style={{ clipPath: "url(#cta5-stepped-mask)" }}
        >
          {/* Ambient Warm Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFF5F5] via-[#F7D6D0] to-[#E2B4BD]" />

          {/* Radial Lighting Highlights */}
          <div className="absolute -top-1/4 -right-1/4 w-3/4 h-3/4 rounded-full bg-white/40 blur-2xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-3/4 h-3/4 rounded-full bg-peachPink/30 blur-2xl" />

          {/* Subtle Sakura Tree Silhouette in Background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(74, 74, 74, 0.2) 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />

          {/* Interactive 3D Sakura Blossom Sculpture */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              perspective: 1200,
              rotateX: tiltX,
              rotateY: tiltY,
            }}
          >
            {/* Rotating Core Group */}
            <motion.div
              animate={{
                rotateZ: [0, 360],
                rotateX: [0, 15, 0, -15, 0],
                rotateY: [0, -20, 0, 20, 0],
                y: [0, -8, 0, 8, 0],
              }}
              transition={{
                rotateZ: { duration: 24, repeat: Infinity, ease: "linear" },
                rotateX: { duration: 12, repeat: Infinity, ease: "easeInOut" },
                rotateY: { duration: 14, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              }}
              className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center transform-gpu"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* 5 Glossy 3D Sakura Petals Arrayed in Radial Orbit */}
              {[0, 72, 144, 216, 288].map((angle, idx) => (
                <motion.div
                  key={`petal-${angle}`}
                  className="absolute w-28 h-40 sm:w-36 sm:h-48 origin-bottom rounded-[50%_50%_35%_35%] shadow-2xl filter backdrop-blur-sm"
                  style={{
                    transform: `rotateZ(${angle}deg) translateY(-32px) rotateX(${idx % 2 === 0 ? 25 : -20}deg) rotateY(${idx * 10}deg)`,
                    background:
                      idx % 2 === 0
                        ? "linear-gradient(135deg, #FFF5F5 0%, #F7D6D0 45%, #E2B4BD 85%, #d495a1 100%)"
                        : "linear-gradient(135deg, #F7D6D0 0%, #E2B4BD 50%, #c88390 100%)",
                    boxShadow:
                      "0 15px 35px rgba(226, 180, 189, 0.45), inset 0 2px 10px rgba(255, 255, 255, 0.7)",
                  }}
                >
                  {/* Glossy highlight streak on petal */}
                  <div className="absolute top-4 left-4 right-8 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-[1px]" />
                </motion.div>
              ))}

              {/* Central Glowing Blossom Core / Stamen */}
              <div
                className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-peachPink via-white to-dustyMauve shadow-xl flex items-center justify-center"
                style={{
                  boxShadow: "0 0 35px rgba(247, 214, 208, 0.9), inset 0 0 15px rgba(255,255,255,0.9)",
                }}
              >
                <Sparkles className="w-7 h-7 text-charcoal/70 animate-pulse" />
              </div>

              {/* Orbiting Ring of Mini Floating Petals */}
              {[...Array(10)].map((_, i) => {
                const orbitAngle = (i * 36) * (Math.PI / 180);
                const radius = 130;
                const x = Math.round(Math.cos(orbitAngle) * radius * 100) / 100;
                const y = Math.round(Math.sin(orbitAngle) * radius * 100) / 100;
                return (
                  <motion.div
                    key={`mini-petal-${i}`}
                    animate={{
                      scale: [0.85, 1.15, 0.85],
                      opacity: [0.6, 0.95, 0.6],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 4 + (i % 3),
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.3,
                    }}
                    className="absolute w-6 h-9 rounded-[50%_50%_35%_35%] shadow-md pointer-events-none"
                    style={{
                      transform: `translate(${x}px, ${y}px) rotate(${i * 36}deg)`,
                      background: "linear-gradient(135deg, #FFF5F5 0%, #F7D6D0 100%)",
                    }}
                  />
                );
              })}
            </motion.div>
          </motion.div>

          {/* Floating Subtle Shimmer Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-2 h-2 rounded-full bg-white/80 blur-[0.5px]"
                animate={{
                  y: [120, -40],
                  x: [0, (i % 2 === 0 ? 30 : -30)],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 5 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.7,
                }}
                style={{
                  left: `${15 + i * 10}%`,
                  bottom: "10%",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2. CTA Content Below Mask */}
      <div className="mt-8 flex flex-col items-center max-w-2xl mx-auto">
        {/* Subtle Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mauve/20 border border-dustyPink/30 text-peachPink text-xs font-semibold uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5 text-peachPink" />
          <span>{badge}</span>
        </div>

        {/* Headline */}
        <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-cream leading-tight">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="font-poppins text-cream/70 text-sm sm:text-base mt-4 font-light leading-relaxed max-w-xl">
          {subtitle}
        </p>

        {/* Primary CTA Pill Button */}
        <div className="mt-8">
          <Link
            href={buttonHref}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-peachPink text-charcoal font-bold text-sm sm:text-base hover:bg-cream hover:text-charcoal transition-all shadow-xl hover:shadow-peachPink/30 hover:scale-105 active:scale-95 group"
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>

        {/* Frictionless Micro-Features Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-cream/60">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-peachPink" />
            <span>No Account Required</span>
          </span>
          <span className="text-cream/20">•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-dustyMauve" />
            <span>100% In-Browser Privacy</span>
          </span>
          <span className="text-cream/20">•</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-peachPink" />
            <span>Lossless 1080×1920 HD</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CTA5;
