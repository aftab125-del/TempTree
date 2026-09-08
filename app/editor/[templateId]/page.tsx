"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import templatesData from "@/data/templates.json";
import { Template, LayoutJson } from "@/types/template";
import TemplateCanvas from "@/components/TemplateCanvas";
import {
  ArrowLeft,
  Download,
  Upload,
  Type,
  Palette,
  Trash2,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Move,
} from "lucide-react";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params?.templateId as string;

  const templates: Template[] = templatesData as Template[];
  const initialTemplate = templates.find((t) => t.id === templateId) || templates[0];

  // Editor State
  const [template, setTemplate] = useState<Template>(initialTemplate);
  const [activeObject, setActiveObject] = useState<any | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<any | null>(null);
  const [canvasScale, setCanvasScale] = useState<number>(0.38);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [selectedBgColor, setSelectedBgColor] = useState<string>(
    initialTemplate.layoutJson.backgroundColor || "#4A4A4A"
  );

  // Hidden file input ref for image uploads
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Responsive scale calculation to fit viewport
  useEffect(() => {
    const computeScale = () => {
      // Calculate available height: viewport minus top bar (70px) and padding (80px)
      const availableHeight = window.innerHeight - 150;
      const availableWidth = window.innerWidth - 380; // Leaving room for side toolbar on desktop
      
      const scaleFromHeight = availableHeight / 1920;
      const scaleFromWidth = Math.max(0.2, (availableWidth > 0 ? availableWidth : window.innerWidth - 40) / 1080);
      
      const optimalScale = Math.min(scaleFromHeight, scaleFromWidth);
      setCanvasScale(Math.max(0.22, Math.min(0.48, optimalScale)));
    };

    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, []);

  // Handle Canvas Ready
  const handleCanvasReady = (canvasInstance: any) => {
    setFabricCanvas(canvasInstance);
  };

  // Selection change listener from Fabric.js
  const handleSelectionChange = (obj: any | null) => {
    setActiveObject(obj);
  };

  // ============================================================================
  // BACKGROUND COLOR / THEME CHANGES
  // ============================================================================
  const handleBackgroundColorChange = (colorHex: string) => {
    setSelectedBgColor(colorHex);
    if (!fabricCanvas) return;
    fabricCanvas.setBackgroundColor(colorHex, fabricCanvas.renderAll.bind(fabricCanvas));
  };

  // ============================================================================
  // TEXT MODIFICATION HANDLERS
  // ============================================================================
  const updateActiveTextProp = (prop: string, value: any) => {
    if (!fabricCanvas || !activeObject || activeObject.type !== "textbox") return;
    activeObject.set(prop, value);
    fabricCanvas.renderAll();
    // Force re-render of toolbar
    setActiveObject({ ...activeObject, [prop]: value });
  };

  // Add new aesthetic text element
  const handleAddText = async (style: "serif" | "sans" | "tagline") => {
    if (!fabricCanvas) return;
    const { fabric } = await import("fabric");

    let textContent = "New Story Heading";
    let fontFamily = "Playfair Display, serif";
    let fontSize = 64;
    let fill = "#FFF5F5";

    if (style === "sans") {
      textContent = "Add your story quote or subtext here...";
      fontFamily = "Poppins, sans-serif";
      fontSize = 32;
    } else if (style === "tagline") {
      textContent = "• DAILY AESTHETIC •";
      fontFamily = "Poppins, sans-serif";
      fontSize = 24;
      fill = "#F7D6D0";
    }

    const textObj = new fabric.Textbox(textContent, {
      left: 540,
      top: 960,
      originX: "center",
      originY: "center",
      fontFamily: fontFamily,
      fontSize: fontSize,
      fill: fill,
      textAlign: "center",
      width: 700,
      cornerColor: "#E2B4BD",
      cornerStyle: "circle",
      cornerSize: 24,
      transparentCorners: false,
      borderColor: "#F7D6D0",
      padding: 12,
    });

    fabricCanvas.add(textObj);
    fabricCanvas.setActiveObject(textObj);
    fabricCanvas.renderAll();
  };

  // ============================================================================
  // IMAGE REPLACEMENT / UPLOAD HANDLER
  // ============================================================================
  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const { fabric } = await import("fabric");

      // If an image is currently selected, replace its source while preserving position and scale
      if (activeObject && activeObject.type === "image") {
        const currentLeft = activeObject.left;
        const currentTop = activeObject.top;
        const currentScaleX = activeObject.scaleX;
        const currentScaleY = activeObject.scaleY;
        const currentAngle = activeObject.angle;

        fabric.Image.fromURL(dataUrl, (newImg: any) => {
          if (!newImg) return;
          newImg.set({
            left: currentLeft,
            top: currentTop,
            scaleX: currentScaleX,
            scaleY: currentScaleY,
            angle: currentAngle,
            cornerColor: "#E2B4BD",
            cornerStyle: "circle",
            cornerSize: 24,
            transparentCorners: false,
            borderColor: "#F7D6D0",
          });

          fabricCanvas.remove(activeObject);
          fabricCanvas.add(newImg);
          fabricCanvas.setActiveObject(newImg);
          fabricCanvas.renderAll();
          setActiveObject(newImg);
        });
      } else {
        // Otherwise add a new photo layer
        fabric.Image.fromURL(dataUrl, (newImg: any) => {
          if (!newImg) return;
          const targetWidth = 600;
          const scale = targetWidth / (newImg.width || 1);

          newImg.set({
            left: 540,
            top: 960,
            originX: "center",
            originY: "center",
            scaleX: scale,
            scaleY: scale,
            cornerColor: "#E2B4BD",
            cornerStyle: "circle",
            cornerSize: 24,
            transparentCorners: false,
            borderColor: "#F7D6D0",
          });

          fabricCanvas.add(newImg);
          fabricCanvas.setActiveObject(newImg);
          fabricCanvas.renderAll();
          setActiveObject(newImg);
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete currently selected element
  const handleDeleteSelected = () => {
    if (!fabricCanvas || !activeObject) return;
    fabricCanvas.remove(activeObject);
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    setActiveObject(null);
  };

  // Bring forward / Send backward
  const handleLayerOrder = (direction: "forward" | "backward") => {
    if (!fabricCanvas || !activeObject) return;
    if (direction === "forward") {
      fabricCanvas.bringForward(activeObject);
    } else {
      fabricCanvas.sendBackwards(activeObject);
    }
    fabricCanvas.renderAll();
  };

  // ============================================================================
  // FULL RESOLUTION PNG EXPORT (1080x1920)
  // ============================================================================
  const handleExportPNG = () => {
    if (!fabricCanvas) return;
    setIsExporting(true);

    // Deselect active object to remove border handles before snapshot
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();

    setTimeout(() => {
      try {
        // Multiplier calculation to export at full 1080x1920 resolution
        const exportMultiplier = 1 / canvasScale;

        const dataUrl = fabricCanvas.toDataURL({
          format: "png",
          quality: 1.0,
          multiplier: exportMultiplier,
        });

        // Trigger browser download
        const link = document.createElement("a");
        const filename = `temptree-${template.category.toLowerCase()}-${template.id}-${Date.now()}.png`;
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 4000);
      } catch (err) {
        console.error("Export error:", err);
      } finally {
        setIsExporting(false);
      }
    }, 150);
  };

  const brandSwatches = [
    { name: "Charcoal", hex: "#4A4A4A" },
    { name: "Dusty Mauve", hex: "#E2B4BD" },
    { name: "Peach Pink", hex: "#F7D6D0" },
    { name: "Blush White", hex: "#FFF5F5" },
    { name: "Midnight", hex: "#1F1F1F" },
    { name: "Pure White", hex: "#FFFFFF" },
  ];

  return (
    <div className="min-h-screen bg-plum text-cream flex flex-col overflow-hidden font-poppins selection:bg-mauve selection:text-cream">
      {/* Hidden file input for uploading images */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ------------------------------------------------------------- */}
      {/* TOP APP HEADER / TOOLBAR */}
      {/* ------------------------------------------------------------- */}
      <header className="h-16 px-4 sm:px-6 bg-plum-dark/95 border-b border-dustyPink/20 flex items-center justify-between z-30 backdrop-blur-md">
        {/* Left: Back Link & Template Info */}
        <div className="flex items-center space-x-3">
          <Link
            href="/gallery"
            className="p-2 rounded-full hover:bg-mauve/30 text-cream transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Gallery</span>
          </Link>

          <div className="h-4 w-px bg-dustyPink/30 hidden sm:block" />

          <div className="flex flex-col">
            <h1 className="font-playfair text-base sm:text-lg font-bold text-cream truncate max-w-[180px] sm:max-w-xs">
              {template.name}
            </h1>
            <span className="text-[10px] uppercase tracking-widest text-dustyPink font-semibold">
              {template.category} &middot; 1080 &times; 1920 Story
            </span>
          </div>
        </div>

        {/* Right: Zoom controls & Export Button */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Zoom In/Out */}
          <div className="hidden md:flex items-center bg-plum/60 rounded-full border border-dustyPink/20 p-1">
            <button
              onClick={() => setCanvasScale((prev) => Math.max(0.2, prev - 0.04))}
              className="p-1.5 hover:bg-mauve/30 rounded-full text-cream transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold px-2 text-dustyPink">
              {Math.round(canvasScale * 100 * 2.63)}%
            </span>
            <button
              onClick={() => setCanvasScale((prev) => Math.min(0.55, prev + 0.04))}
              className="p-1.5 hover:bg-mauve/30 rounded-full text-cream transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export PNG Button */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cream text-plum font-semibold text-xs sm:text-sm hover:bg-dustyPink transition-all shadow-lg hover:shadow-xl transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <Sparkles className="w-4 h-4 animate-spin text-mauve" />
            ) : exportSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-green-700" />
            ) : (
              <Download className="w-4 h-4 text-mauve" />
            )}
            <span>{exportSuccess ? "Downloaded!" : isExporting ? "Exporting..." : "Export Story (PNG)"}</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN WORKSPACE: CANVAS + SIDEBAR TOOLS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
        {/* Left / Center Viewport Area: Interactive Canvas */}
        <div className="flex-grow flex items-center justify-center p-4 sm:p-6 overflow-auto bg-gradient-to-br from-plum-dark via-plum to-[#2A2A2A] relative">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFF5F5_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* Interactive Fabric.js Canvas */}
          <div className="relative z-10 transition-transform duration-200">
            <TemplateCanvas
              layout={template.layoutJson}
              interactive={true}
              scale={canvasScale}
              onCanvasReady={handleCanvasReady}
              onSelectionChange={handleSelectionChange}
              className="border-2 border-dustyPink/40 ring-8 ring-plum/50 shadow-2xl"
            />
          </div>

          {/* Floating Canvas Hint */}
          <div className="absolute bottom-4 left-6 z-20 hidden sm:flex items-center gap-2 text-[11px] text-cream/70 bg-plum-dark/80 px-3.5 py-1.5 rounded-full border border-dustyPink/20 backdrop-blur-md">
            <Move className="w-3 h-3 text-dustyPink" />
            <span>Click any text to edit &bull; Click photo to replace &bull; Drag to reposition</span>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* RIGHT EDITING TOOLBAR */}
        {/* ----------------------------------------------------------- */}
        <aside className="w-full md:w-84 lg:w-96 bg-plum-dark/95 border-t md:border-t-0 md:border-l border-dustyPink/20 p-5 overflow-y-auto max-h-[45vh] md:max-h-none flex flex-col gap-6 backdrop-blur-md z-20">
          {/* Section 1: Replace or Upload Image */}
          <div className="p-4 rounded-2xl bg-plum/50 border border-dustyPink/20">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-dustyPink">
              <ImageIcon className="w-4 h-4" />
              <span>Photography & Images</span>
            </div>

            <button
              onClick={triggerImageUpload}
              className="w-full py-2.5 px-4 rounded-xl bg-mauve/30 hover:bg-mauve/50 border border-dustyPink/40 text-cream text-xs font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4 text-dustyPink" />
              <span>{activeObject?.type === "image" ? "Replace Selected Photo" : "Upload Custom Photo"}</span>
            </button>
            <p className="text-[11px] text-cream/60 mt-2 font-light">
              Select any photo frame and upload your own portrait, outfit, or scenery.
            </p>
          </div>

          {/* Section 2: Selected Element Properties */}
          {activeObject && (
            <div className="p-4 rounded-2xl bg-plum/70 border border-dustyPink/40 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-dustyPink">
                  Editing {activeObject.type === "textbox" ? "Typography" : "Layer"}
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800/60 transition-colors text-xs flex items-center gap-1"
                  title="Delete element"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              {/* Text Controls */}
              {activeObject.type === "textbox" && (
                <div className="space-y-4">
                  {/* Font Family Selector */}
                  <div>
                    <label className="text-[11px] text-cream/70 block mb-1">Font Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateActiveTextProp("fontFamily", "Playfair Display, serif")}
                        className={`py-1.5 px-3 rounded-lg text-xs font-serif transition-colors border ${
                          activeObject.fontFamily?.includes("Playfair")
                            ? "bg-cream text-plum border-cream font-bold"
                            : "bg-plum/60 text-cream border-dustyPink/20"
                        }`}
                      >
                        Playfair Serif
                      </button>
                      <button
                        onClick={() => updateActiveTextProp("fontFamily", "Poppins, sans-serif")}
                        className={`py-1.5 px-3 rounded-lg text-xs font-sans transition-colors border ${
                          activeObject.fontFamily?.includes("Poppins")
                            ? "bg-cream text-plum border-cream font-bold"
                            : "bg-plum/60 text-cream border-dustyPink/20"
                        }`}
                      >
                        Poppins Clean
                      </button>
                    </div>
                  </div>

                  {/* Font Size Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-cream/70 mb-1">
                      <span>Font Size</span>
                      <span className="font-semibold">{Math.round(activeObject.fontSize || 32)}px</span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="140"
                      value={activeObject.fontSize || 32}
                      onChange={(e) => updateActiveTextProp("fontSize", parseInt(e.target.value))}
                      className="w-full accent-mauve cursor-pointer"
                    />
                  </div>

                  {/* Alignment & Text Color */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 bg-plum/80 p-1 rounded-lg border border-dustyPink/20">
                      <button
                        onClick={() => updateActiveTextProp("textAlign", "left")}
                        className={`p-1.5 rounded ${activeObject.textAlign === "left" ? "bg-mauve text-cream" : "text-cream/60"}`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateActiveTextProp("textAlign", "center")}
                        className={`p-1.5 rounded ${activeObject.textAlign === "center" ? "bg-mauve text-cream" : "text-cream/60"}`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateActiveTextProp("textAlign", "right")}
                        className={`p-1.5 rounded ${activeObject.textAlign === "right" ? "bg-mauve text-cream" : "text-cream/60"}`}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Color Swatches for Text */}
                    <div className="flex items-center gap-1.5">
                      {["#FFF5F5", "#F7D6D0", "#E2B4BD", "#4A4A4A", "#FFFFFF"].map((col) => (
                        <button
                          key={col}
                          onClick={() => updateActiveTextProp("fill", col)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            activeObject.fill === col ? "scale-125 border-white shadow-md" : "border-dustyPink/40"
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Layer Ordering (Forward / Backward) */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-dustyPink/20 text-xs">
                <span className="text-cream/70">Layer Stacking:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLayerOrder("backward")}
                    className="px-2.5 py-1 rounded bg-plum/60 hover:bg-mauve/30 border border-dustyPink/30 text-cream text-[11px]"
                  >
                    Send Back
                  </button>
                  <button
                    onClick={() => handleLayerOrder("forward")}
                    className="px-2.5 py-1 rounded bg-plum/60 hover:bg-mauve/30 border border-dustyPink/30 text-cream text-[11px]"
                  >
                    Bring Front
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Add Text Layer */}
          <div className="p-4 rounded-2xl bg-plum/50 border border-dustyPink/20">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-dustyPink">
              <Type className="w-4 h-4" />
              <span>Add Typography</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAddText("serif")}
                className="py-2 px-2 rounded-xl bg-plum/60 hover:bg-mauve/40 border border-dustyPink/30 text-xs font-serif text-cream transition-all flex flex-col items-center gap-1"
              >
                <span className="font-bold text-sm">Aa</span>
                <span className="text-[10px]">Title</span>
              </button>
              <button
                onClick={() => handleAddText("sans")}
                className="py-2 px-2 rounded-xl bg-plum/60 hover:bg-mauve/40 border border-dustyPink/30 text-xs font-sans text-cream transition-all flex flex-col items-center gap-1"
              >
                <span className="font-medium text-sm">Quote</span>
                <span className="text-[10px]">Body</span>
              </button>
              <button
                onClick={() => handleAddText("tagline")}
                className="py-2 px-2 rounded-xl bg-plum/60 hover:bg-mauve/40 border border-dustyPink/30 text-xs text-dustyPink transition-all flex flex-col items-center gap-1"
              >
                <span className="font-semibold text-sm">★ •</span>
                <span className="text-[10px]">Tagline</span>
              </button>
            </div>
          </div>

          {/* Section 4: Canvas Background Palette */}
          <div className="p-4 rounded-2xl bg-plum/50 border border-dustyPink/20">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-dustyPink">
              <Palette className="w-4 h-4" />
              <span>Canvas Palette</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {brandSwatches.map((swatch) => {
                const isSelected = selectedBgColor.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.hex}
                    onClick={() => handleBackgroundColorChange(swatch.hex)}
                    className={`py-2 px-3 rounded-xl border flex items-center gap-2 text-xs transition-all ${
                      isSelected
                        ? "border-cream ring-2 ring-mauve scale-105 font-bold"
                        : "border-dustyPink/20 opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  >
                    <span
                      className={`text-[10px] ${
                        swatch.hex === "#FFF5F5" || swatch.hex === "#F7D6D0" || swatch.hex === "#E2B4BD" || swatch.hex === "#FFFFFF"
                          ? "text-plum font-semibold"
                          : "text-cream"
                      }`}
                    >
                      {swatch.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
