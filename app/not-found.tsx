import React from "react";
import Link from "next/link";
import { Sparkles, Home, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "The requested story canvas or template page could not be found.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#140e13] text-[#FAF7F2] font-poppins flex flex-col items-center justify-center px-4 relative overflow-hidden text-center selection:bg-[#E2B4BD] selection:text-[#181116]">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-radial from-[#F7D6D0]/10 via-[#E2B4BD]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-[400px] h-[400px] rounded-full bg-radial from-[#4A283D]/20 to-transparent blur-3xl pointer-events-none" />

      {/* Floating Eyebrow */}
      <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-[#E2B4BD]/30 mb-8 backdrop-blur-md shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-[#F7D6D0] animate-pulse" />
        <span className="text-xs uppercase tracking-[0.28em] text-[#F7D6D0] font-semibold">
          ✦ 404 &middot; 迷子の頁 ✦
        </span>
      </div>

      {/* 404 Display */}
      <h1 className="relative z-10 font-playfair text-8xl sm:text-9xl md:text-[11rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2]/80 to-[#FAF7F2]/20 tracking-tight leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        404
      </h1>

      {/* Headline & Description */}
      <h2 className="relative z-10 font-playfair text-2xl sm:text-3xl md:text-4xl text-[#FAF7F2] font-medium tracking-tight mt-6 mb-3">
        This path has drifted away like a blossom.
      </h2>
      <p className="relative z-10 text-sm sm:text-base text-[#FAF7F2]/70 font-light max-w-md mx-auto mb-10 leading-relaxed">
        The canvas or template frame you were looking for doesn&apos;t exist or has returned to the soil.
      </p>

      {/* Action Buttons */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FAF7F2] text-[#181116] font-semibold text-xs uppercase tracking-widest hover:bg-[#F7D6D0] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 group"
        >
          <Home className="w-4 h-4 text-[#181116]" />
          <span>Return to Studio</span>
        </Link>

        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[#FAF7F2] border border-white/20 font-medium text-xs uppercase tracking-widest backdrop-blur-md transition-all group"
        >
          <span>Browse Canvases</span>
          <ArrowRight className="w-4 h-4 text-[#E2B4BD] group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-center text-xs text-[#FAF7F2]/40 font-light tracking-widest uppercase">
        TempTree &middot; A bespoke story editor by Aftab Kathat
      </div>
    </main>
  );
}
