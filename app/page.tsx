import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SakuraScrollHero from "@/components/SakuraScrollHero";
import { Sparkles, ArrowRight, Upload } from "lucide-react";
import HowItWorksStepper from "@/components/HowItWorksStepper";
import ShowcaseReveal from "@/components/ShowcaseReveal";
import FeaturesBento from "@/components/FeaturesBento";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";

export default function HomePage() {
  return (
    <main className="min-h-screen text-cream selection:bg-mauve selection:text-plum flex flex-col relative">
      {/* Top Floating Navigation */}
      <Navbar />

      {/* ------------------------------------------------------------- */}
      {/* PART 2: SAKURA SCROLL HERO (300vh scroll container)            */}
      {/* Fixed background pinned at z-0 with dark overlay at z-[1]      */}
      {/* Freezes on frame 300 once scroll reaches 100%                 */}
      {/* ------------------------------------------------------------- */}
      <SakuraScrollHero />

      {/* ------------------------------------------------------------- */}
      {/* ------------------------------------------------------------- */}
      {/* UPLOAD & EXAMPLES SECTION (Scrolls over fixed blooming tree)  */}
      {/* ------------------------------------------------------------- */}
      <section
        id="examples"
        className="relative z-10 text-cream py-24 px-4 sm:px-6 lg:px-8 border-t border-dustyPink/25"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mauve/25 border border-dustyPink/40 text-cream text-xs font-semibold uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5 text-dustyPink" />
                <span>Upload &amp; Edit Engine</span>
              </div>
              <h2 className="font-playfair text-4xl sm:text-5xl font-bold tracking-tight text-cream">
                Turn any frame into your story.
              </h2>
              <p className="font-poppins text-cream/80 text-base max-w-xl mt-3 font-light">
                Upload any frame design, moodboard, or polaroid collage. Our automatic analyzer detects photo slots so you can swap your photos and export in full 1080&times;1920 HD.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-cream text-plum font-bold text-sm hover:bg-dustyPink hover:text-plum transition-all shadow-lg hover:shadow-xl transform active:scale-95 group w-fit"
              >
                <Upload className="w-4 h-4 text-plum group-hover:scale-110 transition-transform" />
                <span>Upload Your Template Frame</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Animated 3D Perspective Stepper: How It Works */}
          <div className="pt-8 border-t border-dustyPink/20">
            <HowItWorksStepper />
          </div>

          {/* Interactive Before/After Showcase Reveal (skiper71 Image Reveal pattern) */}
          <div className="mt-20 pt-8 border-t border-dustyPink/20">
            <ShowcaseReveal />
          </div>

          {/* Core Capabilities Bento Grid (React Bits bento-25, 16, 5, 7) */}
          <div className="mt-20 pt-8 border-t border-dustyPink/20">
            <FeaturesBento />
          </div>

          {/* Searchable FAQ with Topic Filters & Instant Results (React Bits faq-8) */}
          <div className="mt-20 pt-8 border-t border-dustyPink/20">
            <FAQSection />
          </div>
        </div>
      </section>

      {/* PART 4: FINAL AMBIENT CALL-TO-ACTION (React Bits CTA 5)       */}
      {/* ------------------------------------------------------------- */}
      <div className="border-t border-dustyPink/20">
        <FinalCTASection />
      </div>

      {/* Minimal Footer */}
      <footer className="relative z-10 bg-plum-dark/95 text-cream/80 py-14 px-4 sm:px-6 lg:px-8 border-t border-dustyPink/25 text-center sm:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-dustyPink" />
              <span className="font-playfair text-xl font-bold text-cream">
                TempTree
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-peachPink/80 ml-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                桜の工房
              </span>
            </div>
            <p className="text-xs font-light text-cream/60 font-poppins mt-1">
              A bespoke story editor, made by Aftab Kathat. Private by design.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-cream/70">
            <Link href="/gallery" className="hover:text-dustyPink transition-colors text-dustyPink font-medium">
              Upload Template
            </Link>
            <Link href="/#how-it-works" className="hover:text-dustyPink transition-colors">
              How It Works
            </Link>
            <Link href="/#faq" className="hover:text-dustyPink transition-colors">
              FAQ
            </Link>
            <Link href="/privacy" className="hover:text-dustyPink transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-dustyPink transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-dustyPink/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-cream/50 font-light">
          <p>&copy; {new Date().getFullYear()} TempTree &middot; All rights reserved.</p>
          <p className="tracking-wide">Runs 100% in your browser &middot; Zero cloud photo uploads</p>
        </div>
      </footer>
    </main>
  );
}
