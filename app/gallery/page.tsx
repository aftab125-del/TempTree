"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TemplateCard from "@/components/TemplateCard";
import templatesData from "@/data/templates.json";
import { Template, Category, CATEGORIES } from "@/types/template";
import { Search, Sparkles, Filter, LayoutGrid } from "lucide-react";

function GalleryContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") as Category | null;

  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory && CATEGORIES.includes(initialCategory) ? initialCategory : "All"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const templates: Template[] = templatesData as Template[];

  // Filter templates by selected category and search query
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory =
        selectedCategory === "All" || t.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch =
        searchQuery.trim() === "" ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-cream text-plum selection:bg-mauve selection:text-cream flex flex-col">
      <Navbar />

      {/* Gallery Header Banner */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-plum via-plum-light to-cream text-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-mauve/40 border border-dustyPink/40 text-cream text-xs font-semibold uppercase tracking-widest mb-4 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-dustyPink" />
              <span>Full Template Catalog</span>
            </div>

            <h1 className="font-playfair text-4xl sm:text-6xl font-bold tracking-tight text-cream drop-shadow-md">
              Aesthetic Story Gallery
            </h1>

            <p className="mt-4 text-cream/80 font-poppins text-sm sm:text-base font-light">
              Explore customizable Instagram Story layouts designed around distinct moods. Free forever with high-resolution 1080&times;1920 exports.
            </p>
          </div>

          {/* Search and Category Filter Bar */}
          <div className="mt-12 max-w-4xl mx-auto bg-plum/80 border border-dustyPink/30 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dustyPink" />
              <input
                type="text"
                placeholder="Search by aesthetic, tag, or mood (e.g. 'polaroid', 'sakura', 'minimal')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-plum-dark/60 border border-dustyPink/30 text-cream placeholder-dustyPink/60 focus:outline-none focus:border-dustyPink focus:ring-2 focus:ring-mauve/40 text-sm font-poppins transition-all"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                  selectedCategory === "All"
                    ? "bg-cream text-plum shadow-md scale-105"
                    : "bg-plum/50 text-cream/80 hover:bg-mauve/50 border border-dustyPink/20"
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
                        ? "bg-cream text-plum shadow-md scale-105"
                        : "bg-plum/50 text-cream/80 hover:bg-mauve/50 border border-dustyPink/20"
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
      <section className="flex-grow py-16 px-4 sm:px-6 lg:px-8 bg-cream">
        <div className="max-w-7xl mx-auto">
          {/* Active filter indication */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-plum/10">
            <div className="flex items-center gap-2 text-sm font-poppins text-plum/70">
              <LayoutGrid className="w-4 h-4 text-mauve" />
              <span>
                Showing <strong className="text-plum">{filteredTemplates.length}</strong> {filteredTemplates.length === 1 ? "template" : "templates"}
                {selectedCategory !== "All" && ` in ${selectedCategory}`}
              </span>
            </div>

            {selectedCategory !== "All" && (
              <button
                onClick={() => setSelectedCategory("All")}
                className="text-xs font-semibold text-mauve hover:text-plum underline transition-colors"
              >
                Clear Category Filter
              </button>
            )}
          </div>

          {/* Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-plum/5 rounded-3xl border border-plum/10 p-8">
              <Filter className="w-12 h-12 text-mauve mx-auto mb-4 opacity-60" />
              <h3 className="font-playfair text-2xl font-bold text-plum mb-2">
                No templates matched your criteria
              </h3>
              <p className="text-sm text-plum/70 max-w-md mx-auto mb-6">
                Try searching for another keyword or reset the category filter to browse all aesthetics.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="px-6 py-2.5 rounded-full bg-plum text-cream text-xs font-semibold hover:bg-mauve transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-plum text-cream/70 py-8 px-4 text-center text-xs border-t border-dustyPink/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-playfair text-lg font-bold text-cream">TempTree</span>
          <span>1080&times;1920 Instagram Story Dimensions &middot; Free In-Browser Studio</span>
          <Link href="/" className="hover:text-cream transition-colors underline">
            Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center text-plum">
          <p className="font-playfair text-xl animate-pulse">Loading gallery...</p>
        </div>
      }
    >
      <GalleryContent />
    </Suspense>
  );
}
