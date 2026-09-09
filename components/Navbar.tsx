"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Grid, Palette, Upload } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-cream/95 backdrop-blur-md border-b border-dustyPink/40 py-3 shadow-sm text-plum"
          : "bg-gradient-to-b from-plum/70 to-transparent py-5 text-cream"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <Link
          href="/"
          className="flex items-center space-x-2 group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-mauve/25 border border-dustyPink/40 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles
              className={`w-4 h-4 ${
                isScrolled ? "text-plum" : "text-cream"
              } transition-colors`}
            />
          </div>
          <span className="font-playfair text-2xl font-bold tracking-tight">
            TempTree
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link
            href="/#categories"
            className={`${
              isScrolled ? "text-plum/90 hover:text-plum" : "text-cream/90 hover:text-cream"
            } transition-colors tracking-wide`}
          >
            Aesthetics
          </Link>
          <Link
            href="/gallery"
            className={`${
              isScrolled ? "text-plum/90 hover:text-plum" : "text-cream/90 hover:text-cream"
            } transition-colors tracking-wide flex items-center gap-1.5`}
          >
            <Grid className="w-4 h-4" />
            Gallery
          </Link>
          <Link
            href="/upload-template"
            className={`${
              isScrolled ? "text-plum/90 hover:text-plum" : "text-cream/90 hover:text-cream"
            } transition-colors tracking-wide flex items-center gap-1.5`}
          >
            <Upload className="w-4 h-4" />
            Upload Template
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Link
            href="/upload-template"
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium tracking-wide transition-all border ${
              isScrolled
                ? "border-plum/30 bg-plum/5 hover:bg-plum/10 text-plum"
                : "border-cream/35 bg-cream/10 hover:bg-cream/20 text-cream backdrop-blur-sm"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Template</span>
          </Link>

          <Link
            href="/gallery"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg transform active:scale-95 ${
              isScrolled
                ? "bg-plum text-cream hover:bg-plum-light"
                : "bg-cream text-plum hover:bg-dustyPink hover:text-plum"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Browse Templates</span>
            <span className="sm:hidden">Browse</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
