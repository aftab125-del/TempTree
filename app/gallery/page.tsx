"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Fuse from "fuse.js";
import Navbar from "@/components/Navbar";
import TemplateCard from "@/components/TemplateCard";
import templatesData from "@/data/templates.json";
import { Template, Category, CATEGORIES } from "@/types/template";
import { Search, Sparkles, Filter, LayoutGrid, X, RotateCcw, Upload } from "lucide-react";

function GalleryContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") as Category | null;

  // Selected aesthetic filter pill ("All" or specific Category)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory && CATEGORIES.includes(initialCategory) ? initialCategory : "All"
  );

  // Raw user search input (updates instantaneously for zero UI typing lag)
  const [rawSearchQuery, setRawSearchQuery] = useState("");

  // Debounced search query (updates 200ms after user pauses typing)
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const templates: Template[] = templatesData as Template[];

  /**
   * Search Input Debounce (200ms)
   *
   * Why debounce?
   * Typing fast triggers re-renders and re-computes Fuse.js search on every single keystroke.
   * Debouncing by 200ms preserves crisp input responsiveness while sparing computational
   * overhead until the user pauses typing.
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(rawSearchQuery);
    }, 200);

    return () => clearTimeout(handler);
  }, [rawSearchQuery]);

  /**
   * Fuse.js Client-Side Search Instance
   *
   * How this interacts with templates.json:
   * - templates.json serves as our local, static repository of template "recipes" (no database or external API needed).
   * - Fuse.js builds an in-memory index of these JSON objects directly in the browser.
   * - Weights:
   *   - 'name' (weight: 0.7): Template titles are primary identifiers (e.g., "Sakura Ethereal Haze", "Cyber Sparkle 2000").
   *   - 'category' (weight: 0.3): Aesthetic category matches (e.g., "Dreamy", "Y2K", "Minimal").
   * - Threshold (0.35): The sweet spot between exact matching (0.0) and matching anything (1.0).
   *   At 0.35, it forgives common typos (e.g., "sakrua" -> "Sakura", "minmal" -> "Minimal")
   *   without returning false positives.
   * - ignoreLocation (true): Allows matching anywhere in the text string, not just at index 0.
   */
  const fuse = useMemo(() => {
    return new Fuse<Template>(templates, {
      keys: [
        { name: "name", weight: 0.7 },
        { name: "category", weight: 0.3 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [templates]);

  /**
   * Combined AND Filtering:
   *
   * Evaluates both conditions together:
   * 1. Fuzzy Search: If a debounced search term exists, Fuse.js ranks matching templates.
   *    If no search term exists, all templates remain in consideration.
   * 2. Category Filter: If a specific category is selected (e.g., "Dreamy"),
   *    only templates belonging to that category are kept.
   */
  const filteredTemplates = useMemo(() => {
    const trimmed = debouncedQuery.trim();

    // Step 1: Fuzzy search with Fuse.js if a search term is present
    let results: Template[] = templates;
    if (trimmed !== "") {
      const searchResults = fuse.search(trimmed);
      results = searchResults.map((result) => result.item);
    }

    // Step 2: Apply category filter (AND logic)
    if (selectedCategory !== "All") {
      results = results.filter(
        (t) => t.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return results;
  }, [templates, fuse, debouncedQuery, selectedCategory]);

  // Handler to clear search input immediately
  const handleClearSearch = () => {
    setRawSearchQuery("");
    setDebouncedQuery("");
  };

  // Handler to reset all filters (search + category)
  const handleResetFilters = () => {
    setRawSearchQuery("");
    setDebouncedQuery("");
    setSelectedCategory("All");
  };

  const isFiltered = rawSearchQuery.trim() !== "" || selectedCategory !== "All";

  return (
    <div className="min-h-screen bg-blushWhite text-charcoal selection:bg-dustyMauve selection:text-blushWhite flex flex-col font-poppins">
      <Navbar />

      {/* Gallery Header Banner */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-charcoal via-charcoal-light to-blushWhite text-blushWhite">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dustyMauve/30 border border-peachPink/40 text-blushWhite text-xs font-semibold uppercase tracking-widest mb-4 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-peachPink" />
              <span>Full Template Catalog</span>
            </div>

            <h1 className="font-playfair text-4xl sm:text-6xl font-bold tracking-tight text-blushWhite drop-shadow-md">
              Aesthetic Story Gallery
            </h1>

            <p className="mt-4 text-blushWhite/80 text-sm sm:text-base font-light">
              Explore customizable Instagram Story layouts designed around distinct moods. Free forever with high-resolution 1080&times;1920 exports.
            </p>

            {/* Quick Upload Action */}
            <div className="mt-6 flex items-center justify-center">
              <Link
                href="/upload-template"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-peachPink text-charcoal hover:bg-blushWhite font-semibold text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl transform active:scale-95"
              >
                <Upload className="w-4 h-4 text-charcoal" />
                <span>Upload Your Own Template</span>
              </Link>
            </div>
          </div>

          {/* Search and Category Filter Bar (Glassmorphic Container) */}
          <div className="mt-12 max-w-4xl mx-auto bg-charcoal/80 border border-dustyMauve/30 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            {/* Search Input Box positioned above category filter pills */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-peachPink pointer-events-none" />
              <input
                type="text"
                placeholder="Search templates by title or aesthetic (e.g. 'sakura', 'polaroid', 'cyber')..."
                value={rawSearchQuery}
                onChange={(e) => setRawSearchQuery(e.target.value)}
                className="w-full pl-12 pr-11 py-3.5 rounded-2xl bg-charcoal-dark/60 border border-dustyMauve/30 text-blushWhite placeholder-peachPink/50 focus:outline-none focus:border-dustyMauve focus:ring-2 focus:ring-dustyMauve/40 text-sm transition-all shadow-inner"
              />
              {rawSearchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-charcoal/60 hover:bg-dustyMauve/30 text-peachPink hover:text-blushWhite transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Aesthetics Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                  selectedCategory === "All"
                    ? "bg-blushWhite text-charcoal shadow-md scale-105"
                    : "bg-charcoal/50 text-blushWhite/80 hover:bg-dustyMauve/30 border border-dustyMauve/20"
                }`}
              >
                ✦ All Aesthetics ({templates.length})
              </button>

              {CATEGORIES.map((cat) => {
                const count = templates.filter((t) => t.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                      isSelected
                        ? "bg-blushWhite text-charcoal shadow-md scale-105"
                        : "bg-charcoal/50 text-blushWhite/80 hover:bg-dustyMauve/30 border border-dustyMauve/20"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Templates Grid Section */}
      <section className="flex-grow py-16 px-4 sm:px-6 lg:px-8 bg-blushWhite">
        <div className="max-w-7xl mx-auto">
          {/* Active filter indication & counter */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-charcoal/10">
            <div className="flex items-center gap-2 text-sm text-charcoal/75">
              <LayoutGrid className="w-4 h-4 text-dustyMauve" />
              <span>
                Showing <strong className="text-charcoal font-semibold">{filteredTemplates.length}</strong>{" "}
                {filteredTemplates.length === 1 ? "template" : "templates"}
                {selectedCategory !== "All" && (
                  <span>
                    {" "}in <strong className="text-charcoal">{selectedCategory}</strong>
                  </span>
                )}
                {debouncedQuery.trim() !== "" && (
                  <span>
                    {" "}matching &ldquo;<span className="italic text-charcoal font-medium">{debouncedQuery.trim()}</span>&rdquo;
                  </span>
                )}
              </span>
            </div>

            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal/70 hover:text-charcoal bg-dustyMauve/20 hover:bg-dustyMauve/40 border border-dustyMauve/40 px-3 py-1.5 rounded-full transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-charcoal/70" />
                Reset Filters
              </button>
            )}
          </div>

          {/* Grid or Empty State */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            /* Styled "No templates found" empty state matching glassmorphic/palette aesthetic */
            <div className="text-center py-20 px-6 max-w-xl mx-auto bg-charcoal/5 rounded-3xl border border-charcoal/15 shadow-sm backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-dustyMauve/25 border border-dustyMauve/40 flex items-center justify-center mx-auto mb-5 shadow-inner">
                <Filter className="w-8 h-8 text-dustyMauve" />
              </div>
              <h3 className="font-playfair text-2xl font-bold text-charcoal mb-2">
                No templates found
              </h3>
              <p className="text-sm text-charcoal/70 mb-6 leading-relaxed">
                {debouncedQuery.trim() !== "" ? (
                  <>
                    We couldn&apos;t find any templates matching &ldquo;<span className="font-semibold text-charcoal">{debouncedQuery.trim()}</span>&rdquo;
                    {selectedCategory !== "All" ? ` under the ${selectedCategory} category.` : "."}
                  </>
                ) : (
                  `No templates are currently available in the ${selectedCategory} category.`
                )}
                <br />
                Try searching for another keyword (like &ldquo;sakura&rdquo; or &ldquo;minimal&rdquo;) or clear your active filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-charcoal text-blushWhite text-xs font-semibold hover:bg-charcoal-light shadow-md hover:shadow-lg transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-peachPink" />
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-blushWhite/70 py-8 px-4 text-center text-xs border-t border-dustyMauve/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-playfair text-lg font-bold text-blushWhite">TempTree</span>
          <span>1080&times;1920 Instagram Story Dimensions &middot; Free In-Browser Studio</span>
          <div className="flex items-center space-x-4">
            <Link href="/admin/convert-template" className="hover:text-blushWhite transition-colors text-dustyMauve underline">
              Upload / Convert Frame
            </Link>
            <Link href="/" className="hover:text-blushWhite transition-colors underline">
              Back to Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-blushWhite flex items-center justify-center text-charcoal font-poppins">
          <p className="font-playfair text-xl animate-pulse">Loading gallery...</p>
        </div>
      }
    >
      <GalleryContent />
    </Suspense>
  );
}
