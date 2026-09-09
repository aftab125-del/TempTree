"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Upload,
  Layers,
  ShieldCheck,
  Download,
  ArrowRight,
  Wand2,
  Lock,
  Share2,
  CheckCircle2,
  FileCheck,
  Eye,
  Sliders,
} from "lucide-react";

export default function FeaturesBento() {
  // --- Bento 25 State: File Intake Loop ---
  const [intakeStage, setIntakeStage] = useState<number>(0); // 0: drop, 1: scanning, 2: chips revealed

  useEffect(() => {
    const cycle = setInterval(() => {
      setIntakeStage((prev) => (prev + 1) % 3);
    }, 3800);
    return () => clearInterval(cycle);
  }, []);

  // --- Bento 16 State: Layer Stack Hover ---
  const [isStackHovered, setIsStackHovered] = useState<boolean>(false);

  // --- Bento 7 State: Export Fan Hover ---
  const [isFanHovered, setIsFanHovered] = useState<boolean>(false);

  return (
    <section
      id="features"
      className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
    >
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mauve/20 border border-dustyMauve/30 text-cream text-xs font-semibold uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5 text-peachPink" />
          <span>Core Capabilities</span>
        </div>

        <h2 className="font-playfair text-4xl sm:text-5xl font-bold tracking-tight text-cream">
          Engineered for <br />
          <span className="italic font-normal text-peachPink">
            effortless story creation.
          </span>
        </h2>

        <p className="font-poppins text-cream/75 text-sm sm:text-base font-light mt-4">
          Built from the ground up to eliminate Photoshop frustration. No accounts, no manual slice cutting, just drop your frame and create.
        </p>
      </div>

      {/* ============================================================== */}
      {/* 4-CARD ASYMMETRIC BENTO GRID (bento-25, 16, 5, 7)              */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {/* ------------------------------------------------------------ */}
        {/* CARD 1: BENTO-25 — File Intake & Smart Slot Analyzer          */}
        {/* Col-span-2 on Desktop                                        */}
        {/* ------------------------------------------------------------ */}
        <div className="md:col-span-2 relative rounded-3xl bg-[#181416]/90 border border-dustyMauve/25 p-7 sm:p-9 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col justify-between group">
          {/* Ambient Corner Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-peachPink/10 blur-3xl" />

          {/* Top Interactive Stage: File Intake (bento-25) */}
          <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-[#110e10]/80 border border-dustyMauve/20 p-6 flex flex-col items-center justify-center overflow-hidden mb-6">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px]" />

            {/* STAGE 0: Dropping Frame Document */}
            {intakeStage === 0 && (
              <motion.div
                key="stage-0"
                initial={{ opacity: 0, y: -25, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-mauve/40 to-charcoal border-2 border-dashed border-peachPink/80 flex flex-col items-center justify-center p-2 shadow-lg mb-3">
                  <Upload className="w-6 h-6 text-peachPink animate-bounce" />
                  <span className="text-[9px] font-mono text-cream/80 mt-1">
                    Frame.png
                  </span>
                </div>
                <span className="font-poppins text-xs text-cream/70 font-medium">
                  Dropping frame into intake zone...
                </span>
              </motion.div>
            )}

            {/* STAGE 1: Circular Progress Scanning */}
            {intakeStage === 1 && (
              <motion.div
                key="stage-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="relative w-16 h-16 mb-3 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-dustyMauve/20"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <motion.path
                      className="text-peachPink"
                      strokeWidth="3.5"
                      strokeDasharray="100, 100"
                      initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <Wand2 className="w-6 h-6 text-peachPink absolute" />
                </div>
                <span className="font-mono text-xs text-peachPink font-semibold">
                  Scanning placeholder contours...
                </span>
              </motion.div>
            )}

            {/* STAGE 2: Chips Landing */}
            {intakeStage === 2 && (
              <motion.div
                key="stage-2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 flex flex-wrap items-center justify-center gap-2.5 max-w-md"
              >
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="px-3 py-1.5 rounded-full bg-peachPink/20 border border-peachPink/50 text-cream text-xs font-mono flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-peachPink" />
                  <span>Slot 1: 4:5 Portrait (860×1080)</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="px-3 py-1.5 rounded-full bg-mauve/25 border border-dustyMauve/50 text-cream text-xs font-mono flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-dustyMauve" />
                  <span>Slot 2: 1:1 Square (720×720)</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="px-3.5 py-1.5 rounded-full bg-black/60 border border-white/20 text-cream/90 text-xs font-mono flex items-center gap-1.5 shadow-md"
                >
                  <FileCheck className="w-3.5 h-3.5 text-cream" />
                  <span>Alpha Cutout PNG Ready</span>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Bottom Content Area */}
          <div>
            <div className="flex items-center gap-2 text-peachPink text-xs font-mono font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pattern: bento-25 (Intelligent File Intake)</span>
            </div>
            <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-cream mb-2">
              Smart Slot Analyzer &amp; Auto-Cutouts
            </h3>
            <p className="font-poppins text-cream/75 text-xs sm:text-sm font-light leading-relaxed">
              Drop any moodboard, film border, or polaroid collage. Our visual analyzer identifies placeholder slots, measures proportions, and cuts transparent windows automatically.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* CARD 2: BENTO-16 — Isometric Layer Stack                      */}
        {/* Col-span-1 on Desktop                                        */}
        {/* ------------------------------------------------------------ */}
        <div
          onMouseEnter={() => setIsStackHovered(true)}
          onMouseLeave={() => setIsStackHovered(false)}
          className="relative rounded-3xl bg-[#181416]/90 border border-dustyMauve/25 p-7 sm:p-9 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col justify-between cursor-pointer group"
        >
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-mauve/10 blur-3xl" />

          {/* Top Interactive Stage: 3D Isometric Layer Stack (bento-16) */}
          <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-[#110e10]/80 border border-dustyMauve/20 p-4 flex items-center justify-center overflow-hidden mb-6">
            <div
              className="relative w-44 h-44 transition-transform duration-500"
              style={{
                perspective: "1000px",
              }}
            >
              {/* Slab 1: Top Cutout Frame */}
              <motion.div
                animate={{
                  y: isStackHovered ? -42 : -18,
                  rotateX: 52,
                  rotateZ: -28,
                  scale: isStackHovered ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="absolute inset-0 rounded-2xl border-2 border-peachPink/80 bg-[#2b1f24]/90 p-3 flex flex-col justify-between shadow-2xl z-30"
              >
                <div className="flex justify-between items-center text-[9px] font-mono text-peachPink">
                  <span>Layer 1</span>
                  <span>Frame Overlay</span>
                </div>
                <div className="w-full aspect-[4/3] rounded-lg border border-dashed border-peachPink/80 bg-black/40 flex items-center justify-center">
                  <span className="text-[9px] font-mono text-peachPink">
                    Cutout Window
                  </span>
                </div>
              </motion.div>

              {/* Slab 2: Middle Photo Layer */}
              <motion.div
                animate={{
                  y: isStackHovered ? 0 : 0,
                  rotateX: 52,
                  rotateZ: -28,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="absolute inset-0 rounded-2xl border border-dustyMauve/70 bg-gradient-to-tr from-mauve/40 to-charcoal p-3 flex flex-col justify-between shadow-xl z-20"
              >
                <div className="flex justify-between items-center text-[9px] font-mono text-cream">
                  <span>Layer 2</span>
                  <span>Your Photos</span>
                </div>
                <div className="w-full aspect-[4/3] rounded-lg bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=400&auto=format&fit=crop')]" />
              </motion.div>

              {/* Slab 3: Bottom Canvas Base */}
              <motion.div
                animate={{
                  y: isStackHovered ? 42 : 18,
                  rotateX: 52,
                  rotateZ: -28,
                  scale: isStackHovered ? 0.95 : 1,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="absolute inset-0 rounded-2xl border border-white/20 bg-[#161214] p-3 flex flex-col justify-between shadow-lg z-10"
              >
                <div className="flex justify-between items-center text-[9px] font-mono text-cream/50">
                  <span>Layer 3</span>
                  <span>Canvas 1080×1920</span>
                </div>
                <div className="w-full aspect-[4/3] rounded-lg bg-black/60 flex items-center justify-center text-[9px] font-mono text-cream/40">
                  Base Background
                </div>
              </motion.div>
            </div>

            {/* Hover Prompt */}
            <div className="absolute bottom-3 text-[10px] font-poppins text-cream/50">
              Hover to spread layer stack
            </div>
          </div>

          {/* Bottom Content Area */}
          <div>
            <div className="flex items-center gap-2 text-dustyMauve text-xs font-mono font-semibold uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Pattern: bento-16 (Isometric Stack)</span>
            </div>
            <h3 className="font-playfair text-2xl font-bold text-cream mb-2">
              Non-Destructive Layering
            </h3>
            <p className="font-poppins text-cream/75 text-xs sm:text-sm font-light leading-relaxed">
              Your frame borders, grain, and stickers stay crisp on top while your photos comfortably slide into the slots below.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* CARD 3: BENTO-5 — In-Browser Privacy Shield                   */}
        {/* Col-span-1 on Desktop                                        */}
        {/* ------------------------------------------------------------ */}
        <div className="relative rounded-3xl bg-[#181416]/90 border border-dustyMauve/25 p-7 sm:p-9 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col justify-between group">
          {/* Top Interactive Stage: Security Shield & Scanning Beam (bento-5) */}
          <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-[#110e10]/80 border border-dustyMauve/20 p-4 flex flex-col items-center justify-center overflow-hidden mb-6">
            {/* Slow Rotating Dashed Ring */}
            <div className="absolute w-36 h-36 rounded-full border-2 border-dashed border-peachPink/30 animate-[spin_24s_linear_infinite]" />

            {/* Shield Centerpiece */}
            <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-b from-[#2a1c22] to-[#140e11] border-2 border-peachPink/70 flex items-center justify-center shadow-2xl overflow-hidden">
              <ShieldCheck className="w-10 h-10 text-peachPink drop-shadow-[0_0_12px_rgba(247,214,208,0.6)]" />

              {/* Sweeping Vertical Scanning Beam (bento-5) */}
              <motion.div
                animate={{ y: ["-100%", "200%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-4 bg-gradient-to-b from-transparent via-peachPink/50 to-transparent pointer-events-none"
              />
            </div>

            {/* Floating Security Chips */}
            <div className="relative z-10 mt-5 flex flex-col gap-1.5 items-center">
              <span className="px-3 py-1 rounded-full bg-black/60 border border-dustyMauve/30 text-[10px] font-mono text-cream/90 flex items-center gap-1.5 shadow-sm">
                <Lock className="w-3 h-3 text-peachPink" />
                <span>Zero Server Uploads</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-[9px] font-mono text-cream/60">
                100% In-Browser Session Memory
              </span>
            </div>
          </div>

          {/* Bottom Content Area */}
          <div>
            <div className="flex items-center gap-2 text-peachPink text-xs font-mono font-semibold uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5" />
              <span>Pattern: bento-5 (Client-Side Shield)</span>
            </div>
            <h3 className="font-playfair text-2xl font-bold text-cream mb-2">
              Zero Accounts, 100% Private
            </h3>
            <p className="font-poppins text-cream/75 text-xs sm:text-sm font-light leading-relaxed">
              No sign-ups, no passwords, and no cloud databases. Your personal photos process locally in your browser and are never stored on public servers.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* CARD 4: BENTO-7 — Studio HD 1080×1920 Export Fan             */}
        {/* Col-span-2 on Desktop                                        */}
        {/* ------------------------------------------------------------ */}
        <div
          onMouseEnter={() => setIsFanHovered(true)}
          onMouseLeave={() => setIsFanHovered(false)}
          className="md:col-span-2 relative rounded-3xl bg-[#181416]/90 border border-dustyMauve/25 p-7 sm:p-9 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col justify-between cursor-pointer group"
        >
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-mauve/15 blur-3xl" />

          {/* Top Interactive Stage: Wide Publish-Everywhere Fan (bento-7) */}
          <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-[#110e10]/80 border border-dustyMauve/20 p-4 flex items-center justify-center overflow-hidden mb-6">
            <div className="relative flex items-center justify-center w-full max-w-sm h-full">
              {/* Left Channel Card (Spread on hover) */}
              <motion.div
                animate={{
                  x: isFanHovered ? -75 : -35,
                  rotate: isFanHovered ? -16 : -8,
                  scale: isFanHovered ? 0.95 : 0.9,
                }}
                transition={{ type: "spring", stiffness: 240, damping: 20 }}
                className="absolute aspect-[9/16] h-40 rounded-xl bg-[#241c21] border border-dustyMauve/40 shadow-xl flex flex-col justify-between p-2.5 z-10"
              >
                <span className="text-[9px] font-mono text-dustyMauve">
                  PNG Format
                </span>
                <div className="w-full aspect-square rounded-lg bg-mauve/20 flex items-center justify-center">
                  <Download className="w-4 h-4 text-dustyMauve" />
                </div>
                <span className="text-[8px] font-mono text-cream/60">
                  Lossless Export
                </span>
              </motion.div>

              {/* Center Main Story Card */}
              <motion.div
                animate={{
                  scale: isFanHovered ? 1.05 : 1,
                  y: isFanHovered ? -6 : 0,
                }}
                transition={{ type: "spring", stiffness: 240, damping: 20 }}
                className="relative aspect-[9/16] h-48 rounded-2xl bg-[#2d2228] border-2 border-peachPink/80 shadow-2xl flex flex-col justify-between p-3 z-30"
              >
                <div className="flex justify-between items-center text-[10px] text-cream">
                  <span className="font-playfair font-bold">Story</span>
                  <span className="text-[8px] bg-black/60 px-1.5 py-0.5 rounded text-peachPink">
                    1080×1920
                  </span>
                </div>
                <div className="w-full aspect-video rounded-lg bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=400&auto=format&fit=crop')]" />
                <div className="text-center">
                  <span className="text-[9px] font-semibold text-white">
                    Instagram Ready
                  </span>
                </div>
              </motion.div>

              {/* Right Channel Card (Spread on hover) */}
              <motion.div
                animate={{
                  x: isFanHovered ? 75 : 35,
                  rotate: isFanHovered ? 16 : 8,
                  scale: isFanHovered ? 0.95 : 0.9,
                }}
                transition={{ type: "spring", stiffness: 240, damping: 20 }}
                className="absolute aspect-[9/16] h-40 rounded-xl bg-[#241c21] border border-dustyMauve/40 shadow-xl flex flex-col justify-between p-2.5 z-10"
              >
                <span className="text-[9px] font-mono text-peachPink">
                  Direct Share
                </span>
                <div className="w-full aspect-square rounded-lg bg-peachPink/20 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-peachPink" />
                </div>
                <span className="text-[8px] font-mono text-cream/60">
                  0 Compression
                </span>
              </motion.div>
            </div>

            {/* Hover Prompt */}
            <div className="absolute bottom-3 text-[10px] font-poppins text-cream/50">
              Hover to fan out export channels
            </div>
          </div>

          {/* Bottom Content Area */}
          <div>
            <div className="flex items-center gap-2 text-peachPink text-xs font-mono font-semibold uppercase tracking-wider mb-2">
              <Download className="w-3.5 h-3.5" />
              <span>Pattern: bento-7 (Publish-Everywhere Fan)</span>
            </div>
            <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-cream mb-2">
              Studio HD 1080×1920 Lossless Output
            </h3>
            <p className="font-poppins text-cream/75 text-xs sm:text-sm font-light leading-relaxed">
              Export pixel-perfect PNG stories calibrated to bypass Instagram&apos;s aggressive compression, keeping your fonts razor-sharp and photos vibrant.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
