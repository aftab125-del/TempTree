"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Upload } from "lucide-react";

interface KageNavLinkProps {
  href: string;
  label: string;
  alt: string;
  isScrolled: boolean;
}

/**
 * Kage-inspired Dual-Roll Navigation Item
 * On hover, the primary label rolls up out of sight, and the alternate Japanese / tracking label rolls in from below.
 */
const KageNavLink: React.FC<KageNavLinkProps> = ({
  href,
  label,
  alt,
  isScrolled,
}) => {
  return (
    <Link
      href={href}
      className={`group relative block h-[18px] overflow-hidden text-xs uppercase font-medium tracking-[0.18em] select-none transition-colors ${
        isScrolled
          ? "text-plum/85 hover:text-plum"
          : "text-cream/85 hover:text-cream"
      }`}
    >
      <span className="block h-[18px] leading-[18px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
        {label}
      </span>
      <span className="absolute inset-0 block h-[18px] leading-[18px] translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 text-peachPink font-semibold tracking-[0.26em]">
        {alt}
      </span>
    </Link>
  );
};

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
          : "bg-gradient-to-b from-plum/75 to-transparent py-5 text-cream"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Wordmark with Kage Lantern Glow */}
        <Link
          href="/"
          className="flex items-center space-x-2.5 group focus:outline-none"
        >
          <div className="relative w-8 h-8 rounded-full bg-mauve/25 border border-dustyPink/40 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-peachPink shadow-[0_0_8px_#F7D6D0] animate-pulse" />
            <Sparkles
              className={`w-4 h-4 ${
                isScrolled ? "text-plum" : "text-cream"
              } transition-colors`}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-playfair text-2xl font-bold tracking-tight leading-none">
              TempTree
            </span>
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase opacity-60 text-peachPink leading-none mt-1">
              桜の物語
            </span>
          </div>
        </Link>

        {/* Kage-inspired Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium">
          <KageNavLink
            href="/#how-it-works"
            label="How It Works"
            alt="作法 · STEPS"
            isScrolled={isScrolled}
          />
          <KageNavLink
            href="/#showcase"
            label="Showcase"
            alt="変容 · REVEAL"
            isScrolled={isScrolled}
          />
          <KageNavLink
            href="/#features"
            label="Features"
            alt="機能 · BENTO"
            isScrolled={isScrolled}
          />
          <KageNavLink
            href="/#inspiration"
            label="Templates"
            alt="型録 · CANVASES"
            isScrolled={isScrolled}
          />
          <KageNavLink
            href="/#faq"
            label="FAQ"
            alt="問答 · FAQ"
            isScrolled={isScrolled}
          />
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
