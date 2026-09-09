import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SakuraScrollHero from "@/components/SakuraScrollHero";
import TemplateCard from "@/components/TemplateCard";
import ScrollAnimatedCardGrid from "@/components/ScrollAnimatedCardGrid";
import templatesData from "@/data/templates.json";
import { Template, CATEGORIES } from "@/types/template";
import { Sparkles, ArrowRight, Grid, Wand2, Download, Upload } from "lucide-react";
import { Skiper31 } from "@/components/ui/skiper31";
import HowItWorksStepper from "@/components/HowItWorksStepper";

export default function HomePage() {
  const templates: Template[] = templatesData as Template[];
  // Featured preview selection (4 templates)
  const previewTemplates = templates.slice(0, 4);

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

          {/* Starter Inspiration Header */}
          <div className="mb-8">
            <h3 className="font-playfair text-2xl font-bold text-cream">
              Starter Inspiration
            </h3>
            <p className="text-xs text-cream/70 mt-1 font-light">
              Try these pre-built sample templates directly in the editor, or upload your own frame design above.
            </p>
          </div>

          {/* Template Cards Grid with Skiper-style 3D Fan-out & Scroll Glide */}
          <ScrollAnimatedCardGrid templates={previewTemplates} />

          {/* Animated 3D Perspective Stepper: How It Works */}
          <div className="mt-16 pt-8 border-t border-dustyPink/20">
            <HowItWorksStepper />
          </div>
        </div>
      </section>
 
      {/* ------------------------------------------------------------- */}
      {/* PART 3: SKIPER31 TEXT & MOOD SCROLL ANIMATION                  */}
      {/* ------------------------------------------------------------- */}
      <Skiper31 className="relative z-10 border-t border-dustyPink/20" />

      {/* Minimal Footer */}
      <footer className="relative z-10 bg-plum-dark/90 text-cream/80 py-12 px-4 border-t border-dustyPink/25 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-dustyPink" />
            <span className="font-playfair text-xl font-bold text-cream">
              TempTree
            </span>
          </div>

          <p className="text-xs font-light text-cream/60 font-poppins">
            Aesthetic Story Studio &middot; Crafted with Next.js 14, TypeScript & Tailwind CSS
          </p>

          <div className="flex items-center space-x-6 text-xs text-cream/70">
            <Link href="/gallery" className="hover:text-dustyPink transition-colors text-dustyPink font-medium">
              Upload Template
            </Link>
            <Link href="/#how-it-works" className="hover:text-dustyPink transition-colors">
              How It Works
            </Link>
            <Link href="/#examples" className="hover:text-dustyPink transition-colors">
              Inspiration
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
