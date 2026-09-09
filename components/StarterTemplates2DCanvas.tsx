"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { InfiniteGrid, InfiniteGridItem } from "@/components/ui/skiper5";
import templatesData from "@/data/templates.json";
import { Template } from "@/types/template";
import { Sparkles, Upload, ArrowRight, Grid, Move, Compass } from "lucide-react";
import KageTextReveal from "@/components/ui/KageTextReveal";

export const StarterTemplates2DCanvas: React.FC = () => {
  const templates = templatesData as Template[];

  // Convert templates into InfiniteGrid items with rich visual badges
  const gridItems: InfiniteGridItem[] = useMemo(() => {
    const list: InfiniteGridItem[] = templates.map((t) => {
      // Check if there is a cutout or frame image
      const framePath =
        t.thumbnailUrl?.startsWith("/frames/") || t.thumbnailUrl?.startsWith("/previews/")
          ? t.thumbnailUrl
          : undefined;

      const placeholderCount = t.layoutJson?.elements?.filter(
        (el) => el.type === "image" && (el as any).isPlaceholder
      ).length;

      return {
        id: t.id,
        title: t.name,
        category: t.category,
        description: t.description,
        image: framePath,
        badge: "1080×1920 HD",
        slots: placeholderCount && placeholderCount > 0 ? placeholderCount : (t.id.includes("collage") ? 3 : 2),
        accentColor: t.accentColor || "#E2B4BD",
        href: `/editor/${t.id}`,
      };
    });

    // Insert an interactive Upload card to encourage user uploads inside the canvas!
    list.unshift({
      id: "custom-upload-card",
      title: "Upload Your Frame",
      category: "Custom",
      description: "Drop any frame design to auto-detect slots and create a story.",
      badge: "Your Design",
      slots: 0,
      accentColor: "#F7D6D0",
      href: "/gallery",
    });

    return list;
  }, [templates]);

  return (
    <div id="inspiration" className="w-full">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-mauve/20 border border-dustyPink/30 text-peachPink text-xs font-semibold uppercase tracking-[0.2em] mb-2.5 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-peachPink shadow-[0_0_8px_#F7D6D0] animate-pulse" />
            <span>Interactive 2D Inspiration Canvas</span>
          </div>
          <KageTextReveal
            as="h3"
            japaneseAccent="ひらめきの見本帳 · INSPIRATION ARCHIVE"
            className="text-3xl sm:text-4xl font-bold text-cream block"
            glow
          >
            Explore Starter Templates
          </KageTextReveal>
          <p className="font-poppins text-cream/70 text-sm max-w-xl mt-1.5 font-light">
            Pan across the infinite 2D canvas in any direction. Test-drive any curated template directly in the editor, or toss in your own frame.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-peachPink/15 hover:bg-peachPink/25 border border-peachPink/40 text-cream text-xs font-medium transition-all group"
          >
            <Upload className="w-3.5 h-3.5 text-peachPink group-hover:scale-110 transition-transform" />
            <span>Upload Custom Frame</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 2D Infinite Drag & Scroll Grid (skiper5) */}
      <InfiniteGrid
        items={gridItems}
        columns={6}
        rows={4}
        itemWidth={260}
        itemHeight={380}
        itemGap={28}
        showControls={true}
        className="shadow-2xl border border-dustyPink/30"
      />
    </div>
  );
};

export default StarterTemplates2DCanvas;
