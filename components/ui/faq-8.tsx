"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  id: string | number;
  question: string;
  answer: string;
  category: string;
}

export interface FAQ8Props {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  items: FAQItem[];
  categories?: string[];
  className?: string;
}

export const FAQ8: React.FC<FAQ8Props> = ({
  title = "How can we help?",
  subtitle,
  placeholder = "Search questions, slots, exports, privacy...",
  items,
  categories,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openItemId, setOpenItemId] = useState<string | number | null>(items[0]?.id || null);

  // Derive unique categories if not provided
  const categoryList = useMemo(() => {
    if (categories && categories.length > 0) return ["All", ...categories];
    const unique = Array.from(new Set(items.map((i) => i.category)));
    return ["All", ...unique];
  }, [categories, items]);

  // Filter items by category and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        query === "" ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [items, selectedCategory, searchQuery]);

  const toggleItem = (id: string | number) => {
    setOpenItemId((prev) => (prev === id ? null : id));
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto px-4 py-16", className)}>
      {/* Title */}
      <div className="text-center mb-10">
        <h2 className="font-playfair text-4xl sm:text-5xl font-bold tracking-tight text-cream">
          {title}
        </h2>
        {subtitle && (
          <p className="font-poppins text-cream/70 text-sm sm:text-base mt-3 max-w-xl mx-auto font-light">
            {subtitle}
          </p>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="relative flex items-center w-full rounded-2xl bg-charcoal/90 border border-dustyMauve/30 shadow-xl backdrop-blur-md focus-within:border-peachPink transition-all">
          <Search className="w-5 h-5 text-cream/50 ml-4 pointer-events-none shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent px-3.5 py-4 text-sm sm:text-base text-cream placeholder:text-cream/40 focus:outline-none font-poppins"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mr-3 p-1 rounded-full text-cream/50 hover:text-cream hover:bg-white/10 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {categoryList.map((category) => {
          const isSelected = selectedCategory.toLowerCase() === category.toLowerCase();
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200",
                isSelected
                  ? "bg-cream text-charcoal shadow-md font-semibold"
                  : "bg-charcoal/80 text-cream/70 border border-dustyMauve/25 hover:text-cream hover:border-dustyMauve/60 hover:bg-white/5"
              )}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion List */}
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isOpen = openItemId === item.id;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "rounded-2xl border transition-all duration-200 overflow-hidden",
                    isOpen
                      ? "bg-charcoal/90 border-peachPink/50 shadow-xl"
                      : "bg-charcoal/60 border-dustyMauve/20 hover:border-dustyMauve/40 hover:bg-charcoal/80"
                  )}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus:outline-none group gap-4"
                  >
                    <span className="font-playfair font-semibold text-base sm:text-lg text-cream group-hover:text-peachPink transition-colors">
                      {item.question}
                    </span>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-cream/50 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5">
                        {item.category}
                      </span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-cream/50 group-hover:text-peachPink transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-cream/80 text-sm sm:text-base leading-relaxed font-light font-poppins border-t border-white/5 mt-1 pt-4">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          ) : (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-12 text-center rounded-2xl border border-dashed border-dustyMauve/30 bg-charcoal/40 flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-mauve/20 border border-dustyMauve/40 flex items-center justify-center text-peachPink">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="font-playfair text-lg font-semibold text-cream">
                No matching questions found
              </h3>
              <p className="font-poppins text-xs sm:text-sm text-cream/60 max-w-sm font-light">
                We couldn&apos;t find anything matching &ldquo;{searchQuery}&rdquo;. Try another term or reset your search.
              </p>
              <button
                onClick={clearSearch}
                className="mt-2 px-5 py-2 rounded-full bg-cream text-charcoal font-semibold text-xs hover:bg-peachPink transition-colors shadow"
              >
                Clear Filters &amp; Reset
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FAQ8;
