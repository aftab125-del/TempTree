"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import {
  Move,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

export interface InfiniteGridItem {
  id: string | number;
  title?: string;
  category?: string;
  description?: string;
  image?: string;
  badge?: string;
  slots?: number;
  accentColor?: string;
  href?: string;
  aspectRatio?: string;
  onClick?: () => void;
}

export interface InfiniteGridProps {
  imagePathRoot?: string;
  itemCount?: number;
  itemGap?: number;
  columns?: number;
  rows?: number;
  itemWidth?: number;
  itemHeight?: number;
  className?: string;
  items?: InfiniteGridItem[];
  renderItem?: (item: InfiniteGridItem, index: number) => ReactNode;
  showControls?: boolean;
}

/**
 * Modulo wrapping helper: guarantees positive result in range [min, min + size)
 */
function wrapCoordinate(val: number, min: number, size: number): number {
  return ((((val - min) % size) + size) % size) + min;
}

export const InfiniteGrid: React.FC<InfiniteGridProps> = ({
  imagePathRoot,
  itemCount = 20,
  itemGap = 32,
  columns = 6,
  rows = 4,
  itemWidth = 260,
  itemHeight = 380,
  className,
  items: customItems,
  renderItem,
  showControls = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 600 });
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Pan coordinates and inertia physics
  const panRef = useRef({ x: 0, y: 0 });
  const [panDisplay, setPanDisplay] = useState({ x: 0, y: 0 });
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const pointerStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, time: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0, time: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Total virtual dimensions
  const totalGridWidth = useMemo(
    () => columns * (itemWidth + itemGap),
    [columns, itemWidth, itemGap]
  );
  const totalGridHeight = useMemo(
    () => rows * (itemHeight + itemGap),
    [rows, itemHeight, itemGap]
  );

  // Measure container viewport
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewportSize({ width: rect.width || 1200, height: rect.height || 600 });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Filter items if category active
  const filteredItems = useMemo(() => {
    if (!customItems || customItems.length === 0) return [];
    if (activeCategory === "All") return customItems;
    return customItems.filter(
      (it) => it.category?.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [customItems, activeCategory]);

  const effectiveItems = filteredItems.length > 0 ? filteredItems : customItems || [];

  // Inertia decay glide
  const startInertia = useCallback(() => {
    const friction = 0.93;
    const minVelocity = 0.05;

    const step = () => {
      velocityRef.current.vx *= friction;
      velocityRef.current.vy *= friction;

      if (
        Math.abs(velocityRef.current.vx) > minVelocity ||
        Math.abs(velocityRef.current.vy) > minVelocity
      ) {
        panRef.current.x += velocityRef.current.vx;
        panRef.current.y += velocityRef.current.vy;
        setPanDisplay({
          x: Math.round(panRef.current.x),
          y: Math.round(panRef.current.y),
        });
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        velocityRef.current = { vx: 0, vy: 0 };
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    velocityRef.current = { vx: 0, vy: 0 };

    setIsPointerDown(true);
    setHasDragged(false);

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
      time: performance.now(),
    };

    lastMoveRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    };

    // Capture pointer
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown) return;

    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    if (Math.hypot(dx, dy) > 6) {
      setHasDragged(true);
    }

    const now = performance.now();
    const dt = Math.max(now - lastMoveRef.current.time, 8);
    const moveDx = e.clientX - lastMoveRef.current.x;
    const moveDy = e.clientY - lastMoveRef.current.y;

    // Smooth velocity estimate
    velocityRef.current = {
      vx: (moveDx / dt) * 14,
      vy: (moveDy / dt) * 14,
    };

    lastMoveRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: now,
    };

    panRef.current.x = pointerStartRef.current.panX + dx;
    panRef.current.y = pointerStartRef.current.panY + dy;

    setPanDisplay({
      x: Math.round(panRef.current.x),
      y: Math.round(panRef.current.y),
    });
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDown) return;
    setIsPointerDown(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    // If dragged with momentum, start glide
    if (
      Math.abs(velocityRef.current.vx) > 0.5 ||
      Math.abs(velocityRef.current.vy) > 0.5
    ) {
      startInertia();
    }
  };

  // Wheel Pan
  const handleWheel = (e: React.WheelEvent) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    panRef.current.x -= e.deltaX * 0.7;
    panRef.current.y -= e.deltaY * 0.7;
    setPanDisplay({
      x: Math.round(panRef.current.x),
      y: Math.round(panRef.current.y),
    });
  };

  // Reset to Center
  const resetToCenter = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    panRef.current = { x: 0, y: 0 };
    velocityRef.current = { vx: 0, vy: 0 };
    setPanDisplay({ x: 0, y: 0 });
  };

  // Grid cell indexing
  const gridIndices = useMemo(() => {
    const list: Array<{ col: number; row: number; index: number }> = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        list.push({ col: c, row: r, index: r * columns + c });
      }
    }
    return list;
  }, [columns, rows]);

  // Viewport bounds for wrapping with padding
  const minBoundX = -itemWidth - itemGap;
  const minBoundY = -itemHeight - itemGap;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-[620px] rounded-3xl overflow-hidden select-none border border-dustyMauve/30 bg-charcoal/80 shadow-2xl backdrop-blur-xl group",
        isPointerDown ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      style={{ touchAction: "none" }}
    >
      {/* Background ambient mesh grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(226, 180, 189, 0.45) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
          transform: `translate(${panDisplay.x % 32}px, ${panDisplay.y % 32}px)`,
        }}
      />

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-peachPink/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-dustyMauve/10 blur-3xl pointer-events-none" />

      {/* Tiled 2D Infinite Canvas */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {gridIndices.map(({ col, row, index }) => {
          const baseX = col * (itemWidth + itemGap);
          const baseY = row * (itemHeight + itemGap);

          // Wrapped coordinates in virtual 2D space
          const renderX = wrapCoordinate(
            baseX + panDisplay.x,
            minBoundX,
            totalGridWidth
          );
          const renderY = wrapCoordinate(
            baseY + panDisplay.y,
            minBoundY,
            totalGridHeight
          );

          // Data item selection (cycle through provided items)
          const dataItem: InfiniteGridItem =
            effectiveItems.length > 0
              ? effectiveItems[index % effectiveItems.length]
              : {
                  id: `item-${index}`,
                  title: `Template ${index + 1}`,
                  category: "Story",
                  badge: "1080×1920",
                  image: imagePathRoot
                    ? `${imagePathRoot}/img${(index % itemCount) + 1}.png`
                    : undefined,
                };

          // Velocity-based micro tilt
          const tiltX = Math.max(Math.min(velocityRef.current.vy * 0.15, 8), -8);
          const tiltY = Math.max(Math.min(-velocityRef.current.vx * 0.15, 8), -8);

          return (
            <div
              key={`cell-${col}-${row}`}
              className="absolute pointer-events-auto will-change-transform transform-gpu transition-shadow duration-300"
              style={{
                width: `${itemWidth}px`,
                height: `${itemHeight}px`,
                transform: `translate3d(${renderX}px, ${renderY}px, 0px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
              }}
            >
              {renderItem ? (
                renderItem(dataItem, index)
              ) : (
                <DefaultGridCard
                  item={dataItem}
                  hasDragged={hasDragged}
                  width={itemWidth}
                  height={itemHeight}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Edge Vignette / Progressive Gradient Fades */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-charcoal via-charcoal/70 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-charcoal via-charcoal/70 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-charcoal via-charcoal/70 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-charcoal via-charcoal/70 to-transparent pointer-events-none z-10" />

      {/* Floating HUD Controls Bar */}
      {showControls && (
        <>
          {/* Top Bar: Live Coordinates & Drag Hint */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
            {/* Status & Coordinates badge */}
            <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-charcoal/90 border border-dustyMauve/30 backdrop-blur-md shadow-lg text-xs font-mono text-cream/90">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-peachPink opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-peachPink" />
              </span>
              <span className="font-semibold text-peachPink uppercase tracking-wider text-[10px]">
                2D Infinite Canvas
              </span>
              <span className="text-cream/30">|</span>
              <span className="text-cream/60">
                X: {panDisplay.x > 0 ? `+${panDisplay.x}` : panDisplay.x}
              </span>
              <span className="text-cream/60">
                Y: {panDisplay.y > 0 ? `+${panDisplay.y}` : panDisplay.y}
              </span>
            </div>

            {/* Reset View Button */}
            <button
              onClick={resetToCenter}
              title="Reset view to center (0, 0)"
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-charcoal/90 border border-dustyMauve/30 backdrop-blur-md text-xs font-medium text-cream/80 hover:text-cream hover:bg-dustyMauve/20 hover:border-dustyMauve/60 transition-all shadow-lg active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-dustyMauve" />
              <span>Center</span>
            </button>
          </div>

          {/* Bottom Floating Pill Dock: Category Filters & Drag Instructions */}
          <div className="absolute bottom-4 inset-x-4 flex flex-col sm:flex-row items-center justify-between gap-3 z-20 pointer-events-none">
            {/* Category Filter Pills */}
            <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-full bg-charcoal/90 border border-dustyMauve/30 backdrop-blur-md shadow-xl overflow-x-auto max-w-full">
              {["All", "Dreamy", "Minimal", "Vintage", "Y2K", "Collage"].map((cat) => {
                const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      isSelected
                        ? "bg-dustyMauve text-charcoal font-semibold shadow"
                        : "text-cream/70 hover:text-cream hover:bg-white/5"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Interaction Instructions Pill */}
            <div className="pointer-events-auto hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-charcoal/90 border border-dustyMauve/30 backdrop-blur-md text-xs text-cream/70 shadow-lg">
              <span className="flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-peachPink" />
                <span>Drag to pan in 2D</span>
              </span>
              <span className="text-cream/25">•</span>
              <span>Scroll to navigate</span>
              <span className="text-cream/25">•</span>
              <span className="text-peachPink font-medium">Click card to edit</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Default Aesthetic Story Card for Infinite Grid
 */
const DefaultGridCard: React.FC<{
  item: InfiniteGridItem;
  hasDragged: boolean;
  width: number;
  height: number;
}> = ({ item, hasDragged }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <a
      href={item.href || `/editor/${item.id}`}
      onClick={handleClick}
      className="group relative block w-full h-full rounded-2xl overflow-hidden border border-dustyMauve/25 bg-charcoal/90 shadow-xl hover:shadow-2xl hover:border-peachPink/60 transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Background preview image or artistic gradient */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.title || "Template"}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full p-4 flex flex-col justify-between"
            style={{
              background: `linear-gradient(135deg, #4A4A4A 0%, ${
                item.accentColor || "#E2B4BD"
              }22 50%, #2A2A2A 100%)`,
            }}
          >
            {/* Story frame wireframe simulation */}
            <div className="w-full h-full rounded-xl border border-dashed border-white/20 p-3 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest text-cream/40 uppercase">
                  9:16 Story
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-cream/80">
                  {item.slots ? `${item.slots} Slots` : "Dynamic"}
                </span>
              </div>

              {/* Center cutout placeholder */}
              <div className="my-auto w-full aspect-[4/5] rounded-lg border border-dashed border-peachPink/40 bg-white/5 flex flex-col items-center justify-center gap-1.5 p-2 text-center group-hover:border-peachPink transition-colors">
                <Sparkles className="w-5 h-5 text-peachPink group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium text-cream/90">
                  Photo Slot
                </span>
                <span className="text-[9px] text-cream/50">Auto-detected</span>
              </div>

              <div className="text-[10px] text-cream/40 text-center font-mono">
                1080 &times; 1920
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dark gradient overlay for typography readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

      {/* Card Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1.5 z-10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-peachPink uppercase px-2 py-0.5 rounded-md bg-charcoal/80 border border-peachPink/30">
            {item.category || "Story"}
          </span>
          <span className="text-[10px] font-mono text-cream/60">
            {item.badge || "1080×1920"}
          </span>
        </div>

        <h4 className="font-playfair font-bold text-cream text-base leading-tight group-hover:text-peachPink transition-colors line-clamp-1">
          {item.title}
        </h4>

        {item.description && (
          <p className="text-[11px] text-cream/70 line-clamp-1 font-light">
            {item.description}
          </p>
        )}

        {/* Hover action CTA */}
        <div className="mt-1 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-medium text-cream group-hover:text-peachPink">
          <span>Use in Editor</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </a>
  );
};

export default InfiniteGrid;
