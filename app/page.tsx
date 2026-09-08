import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SakuraScrollHero from "@/components/SakuraScrollHero";
import TemplateCard from "@/components/TemplateCard";
import templatesData from "@/data/templates.json";
import { Template, CATEGORIES } from "@/types/template";
import { Sparkles, ArrowRight, Grid, Wand2, Download } from "lucide-react";

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
      {/* GALLERY PREVIEW SECTION (Scrolls over fixed blooming tree)    */}
      {/* ------------------------------------------------------------- */}
      <section
        id="gallery-preview"
        className="relative z-10 text-cream py-24 px-4 sm:px-6 lg:px-8 border-t border-dustyPink/25"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mauve/25 border border-dustyPink/40 text-cream text-xs font-semibold uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5 text-dustyPink" />
                <span>Curated Story Templates</span>
              </div>
              <h2 className="font-playfair text-4xl sm:text-5xl font-bold tracking-tight text-cream">
                Choose your canvas.
              </h2>
              <p className="font-poppins text-cream/80 text-base max-w-xl mt-3 font-light">
                Handcrafted Instagram Story layouts ready for your photography, quotes, and thoughts. No sign-up, completely free.
              </p>
            </div>

            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-cream text-plum font-semibold text-sm hover:bg-dustyPink hover:text-plum transition-all shadow-lg hover:shadow-xl transform active:scale-95 group w-fit"
            >
              <span>Explore All {templates.length} Templates</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Aesthetic Categories Quick Filter Bar */}
          <div id="categories" className="flex flex-wrap items-center gap-3 mb-12">
            <span className="text-xs uppercase tracking-widest text-dustyPink font-semibold mr-2">
              Aesthetics:
            </span>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/gallery?category=${encodeURIComponent(cat)}`}
                className="px-4 py-2 rounded-full text-xs font-medium bg-plum-light/50 hover:bg-mauve text-cream hover:text-plum border border-dustyPink/30 hover:border-dustyPink transition-all duration-300"
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* Template Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {previewTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>

          {/* Features / How It Works Strip */}
          <div className="mt-24 pt-16 border-t border-dustyPink/20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4 p-6 rounded-2xl bg-plum-light/25 border border-dustyPink/20">
              <div className="w-12 h-12 rounded-2xl bg-mauve/25 border border-dustyPink/40 flex items-center justify-center flex-shrink-0">
                <Grid className="w-6 h-6 text-dustyPink" />
              </div>
              <div>
                <h3 className="font-playfair text-lg font-bold text-cream mb-1">
                  1. Pick an Aesthetic
                </h3>
                <p className="text-xs text-cream/75 font-light leading-relaxed">
                  Browse vintage polaroids, cyber Y2K stickers, soft minimal editorial, or dreamy petals.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 rounded-2xl bg-plum-light/25 border border-dustyPink/20">
              <div className="w-12 h-12 rounded-2xl bg-mauve/25 border border-dustyPink/40 flex items-center justify-center flex-shrink-0">
                <Wand2 className="w-6 h-6 text-dustyPink" />
              </div>
              <div>
                <h3 className="font-playfair text-lg font-bold text-cream mb-1">
                  2. Customize Inline
                </h3>
                <p className="text-xs text-cream/75 font-light leading-relaxed">
                  Click to replace photos, tweak typography, add quotes, and switch background palettes effortlessly.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 rounded-2xl bg-plum-light/25 border border-dustyPink/20">
              <div className="w-12 h-12 rounded-2xl bg-mauve/25 border border-dustyPink/40 flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-dustyPink" />
              </div>
              <div>
                <h3 className="font-playfair text-lg font-bold text-cream mb-1">
                  3. Export High-Res PNG
                </h3>
                <p className="text-xs text-cream/75 font-light leading-relaxed">
                  Download crisp 1080&times;1920 images ready to post straight to Instagram Stories without watermarks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
            <Link href="/gallery" className="hover:text-dustyPink transition-colors">
              Gallery
            </Link>
            <Link href="/#categories" className="hover:text-dustyPink transition-colors">
              Categories
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
