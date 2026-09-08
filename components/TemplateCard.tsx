"use client";

import React from "react";
import Link from "next/link";
import { Template } from "@/types/template";
import TemplateCanvas from "./TemplateCanvas";
import { Edit3, Sparkles } from "lucide-react";

interface TemplateCardProps {
  template: Template;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  // Category color pill styling
  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case "Y2K":
        return "bg-dustyPink text-plum font-bold border-dustyPink";
      case "Minimal":
        return "bg-cream text-plum font-medium border-cream";
      case "Dreamy":
        return "bg-mauve text-cream font-medium border-mauve";
      case "Vintage":
        return "bg-plum text-cream font-medium border-dustyPink/40";
      case "Bold":
        return "bg-plum-dark text-dustyPink font-bold border-dustyPink";
      default:
        return "bg-mauve text-cream border-mauve";
    }
  };

  return (
    <div className="group relative flex flex-col bg-plum-light/50 rounded-3xl p-4 sm:p-5 border border-dustyPink/20 hover:border-dustyPink/60 transition-all duration-500 hover:shadow-2xl hover:shadow-plum/40 hover:-translate-y-1.5 overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-mauve/0 via-dustyPink/10 to-cream/0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Live Canvas Preview Frame (1080x1920 Story aspect ratio) */}
      <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-plum flex items-center justify-center border border-dustyPink/30 shadow-inner group-hover:shadow-2xl transition-all">
        {/* Render live layout canvas scaled down for thumbnail */}
        <div className="transform transition-transform duration-700 group-hover:scale-105">
          <TemplateCanvas
            layout={template.layoutJson}
            interactive={false}
            scale={0.165}
            className="shadow-md"
          />
        </div>

        {/* Hover Overlay with Quick Edit Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-plum/90 via-plum/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center p-4">
          <Link
            href={`/editor/${template.id}`}
            className="w-full py-3 px-4 rounded-xl bg-cream text-plum font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-white active:scale-95 transition-all transform translate-y-2 group-hover:translate-y-0"
          >
            <Edit3 className="w-4 h-4 text-mauve" />
            <span>Customize Story</span>
          </Link>
        </div>

        {/* Category Pill Tag */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs uppercase tracking-wider border shadow-sm backdrop-blur-md ${getCategoryBadgeStyle(
              template.category
            )}`}
          >
            <Sparkles className="w-3 h-3" />
            {template.category}
          </span>
        </div>
      </div>

      {/* Card Info & Details */}
      <div className="mt-4 flex flex-col flex-grow">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-playfair text-xl font-bold text-cream group-hover:text-dustyPink transition-colors">
            {template.name}
          </h3>
          <span className="text-[11px] font-poppins uppercase tracking-widest text-dustyPink/80">
            1080 &times; 1920
          </span>
        </div>

        <p className="mt-1 text-xs text-cream/70 line-clamp-2 font-poppins font-light leading-relaxed">
          {template.description}
        </p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-plum/60 text-dustyPink/90 border border-dustyPink/20"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-4 pt-3 border-t border-dustyPink/15 flex items-center justify-between">
          <span className="text-xs text-cream/60 font-poppins">Free Export</span>
          <Link
            href={`/editor/${template.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-dustyPink hover:text-cream transition-colors group/link"
          >
            <span>Open in Editor</span>
            <span className="transition-transform group-hover/link:translate-x-1">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
