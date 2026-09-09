"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Upload } from "lucide-react";

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
        <nav className="hidden lg:flex items-center space-x-7 text-sm font-medium">
          <Link
            href="/#how-it-works"
            className={`${
              isScrolled ? "text-plum/90 hover:text-plum" : "text-cream/90 hover:text-cream"
            } transition-colors tracking-wide`}
          >
            How It Works
          </Link>
          <Link
            href="/#showcase"
            className={`${
              isScrolled ? "text-plum/90 hover:text-plum" : "text-cream/90 hover:text-cream"
            } transition-colors tracking-wide`}
          >
            Showcase
          </Link>
          <Link
            href="/#features"
            className={`${
              isScrolled ? "text-plum/90 hover:text-plum" : "text-cream/90 hover:text-cream"
            } transition-colors tracking-wide`}
          >
            Features
          </Link>
          <Link
            href="/#inspiration"
            className={`${
              isScrolled ? "text-plum/90 hover:text-plum" : "text-cream/90 hover:text-cream"
            } transition-colors tracking-wide`}
          >
            Templates
          </Link>
          <Link
            href="/#faq"
            className={`${
              isScrolled ? "text-plum/90 hover:text-plum" : "text-cream/90 hover:text-cream"
            } transition-colors tracking-wide`}
          >
            FAQ
          </Link>
        </nav>

        {/* Action Button */}
        <div className="flex items-center space-x-3">
          <Link
            href="/gallery"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg transform active:scale-95 ${
              isScrolled
                ? "bg-plum text-cream hover:bg-plum-light"
                : "bg-cream text-plum hover:bg-dustyPink hover:text-plum"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload &amp; Edit</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
