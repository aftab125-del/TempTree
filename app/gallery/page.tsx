"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowRight,
  Plus,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import templatesData from "@/data/templates.json";
import { Template } from "@/types/template";
import { DetectedSlot } from "@/lib/frame-converter";
import { saveTemplate } from "@/lib/template-store";
import TemplateDesignGuidelines from "@/components/TemplateDesignGuidelines";
import MobileAtmosphericBackground from "@/components/ui/MobileAtmosphericBackground";

interface PreviewData {
  placeholders: DetectedSlot[];
  dimensions: { width: number; height: number };
  originalDimensions: { width: number; height: number };
  resizedOriginalBase64: string;
  cutoutBase64: string;
  templateJson: any;
}

export default function UploadTemplateFlowPage() {
  const router = useRouter();

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  // Advanced Options State
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [maxColorVariance, setMaxColorVariance] = useState<number>(15);
  const [minWidth, setMinWidth] = useState<number>(160);
  const [minHeight, setMinHeight] = useState<number>(180);
  const [contrastThreshold, setContrastThreshold] = useState<number>(28);
  const [detectPlusIcon, setDetectPlusIcon] = useState<boolean>(true);

  // Conversion States
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [activeTab, setActiveTab] = useState<"overlay" | "cutout">("overlay");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Starter example templates from templates.json for quick inspiration
  const starterTemplates = (templatesData as Template[]).slice(0, 3);

  // Handle image selection via input or drag-and-drop
  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setErrorMsg("Please select an image file (PNG, JPG, WebP).");
      return;
    }
    setErrorMsg(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);

    // Auto-fill template name if currently empty
    if (!name) {
      const cleanName = selectedFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setName(cleanName);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Run in-memory detection
  const handleConvert = async (manualSlotsOverride?: DetectedSlot[]) => {
    if (!file) {
      setErrorMsg("Please choose or drop a frame image first.");
      return;
    }

    setIsConverting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name.trim() || "My Story Template");
      formData.append("category", "Custom");
      formData.append("description", "Custom story frame");
      formData.append("maxColorVariance", maxColorVariance.toString());
      formData.append("minWidth", minWidth.toString());
      formData.append("minHeight", minHeight.toString());
      formData.append("contrastThreshold", contrastThreshold.toString());
      formData.append("detectPlusIcon", detectPlusIcon ? "true" : "false");

      if (manualSlotsOverride && manualSlotsOverride.length > 0) {
        formData.append("manualSlots", JSON.stringify(manualSlotsOverride));
      }

      const response = await fetch("/api/admin/convert-frame", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process frame conversion");
      }

      setPreviewData(data);
      setActiveTab("overlay");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during conversion.");
    } finally {
      setIsConverting(false);
    }
  };

  // Update slot coordinates
  const handleUpdateSlot = (index: number, updates: Partial<DetectedSlot>) => {
    if (!previewData) return;
    const newPlaceholders = [...previewData.placeholders];
    newPlaceholders[index] = { ...newPlaceholders[index], ...updates };

    const updatedElements = previewData.templateJson.layoutJson.elements.map((el: any) => {
      if (el.id === `photo-placeholder-${index + 1}`) {
        return {
          ...el,
          left: newPlaceholders[index].x,
          top: newPlaceholders[index].y,
          width: newPlaceholders[index].width,
          height: newPlaceholders[index].height,
        };
      }
      return el;
    });

    setPreviewData({
      ...previewData,
      placeholders: newPlaceholders,
      templateJson: {
        ...previewData.templateJson,
        layoutJson: {
          ...previewData.templateJson.layoutJson,
          elements: updatedElements,
        },
      },
    });
  };

  // Delete a detected slot
  const handleDeleteSlot = (index: number) => {
    if (!previewData) return;
    const newPlaceholders = previewData.placeholders.filter((_, i) => i !== index);

    const samplePhotos = [
      "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1000&auto=format&fit=crop&q=80",
    ];
    const newElements: any[] = newPlaceholders.map((p, idx) => ({
      id: `photo-placeholder-${idx + 1}`,
      type: "image",
      left: p.x,
      top: p.y,
      width: p.width,
      height: p.height,
      src: samplePhotos[idx % samplePhotos.length],
      placeholderLabel: newPlaceholders.length > 1 ? `Photo #${idx + 1}` : "Tap to replace photo",
      isPlaceholder: true,
      stroke: "#FFF5F5",
      strokeWidth: 2,
    }));

    const overlay = previewData.templateJson.layoutJson.elements.find(
      (el: any) => el.id === "frame-cutout-overlay"
    ) || {
      id: "frame-cutout-overlay",
      type: "image",
      left: 0,
      top: 0,
      width: 1080,
      height: 1920,
      src: previewData.cutoutBase64,
      selectable: false,
      isPlaceholder: false,
    };
    newElements.push(overlay);

    setPreviewData({
      ...previewData,
      placeholders: newPlaceholders,
      templateJson: {
        ...previewData.templateJson,
        layoutJson: {
          ...previewData.templateJson.layoutJson,
          elements: newElements,
        },
      },
    });
  };

  // Add custom slot
  const handleAddSlot = () => {
    if (!previewData) return;
    const newSlot: DetectedSlot = {
      x: 140,
      y: 360 + (previewData.placeholders.length % 4) * 120,
      width: 800,
      height: 600,
      color: "#333333",
      rgb: { r: 51, g: 51, b: 51 },
      hasPlusIcon: false,
      rectangularity: 1,
      area: 480000,
    };

    const newPlaceholders = [...previewData.placeholders, newSlot];

    const samplePhotos = [
      "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80",
    ];
    const newElements: any[] = newPlaceholders.map((p, idx) => ({
      id: `photo-placeholder-${idx + 1}`,
      type: "image",
      left: p.x,
      top: p.y,
      width: p.width,
      height: p.height,
      src: samplePhotos[idx % samplePhotos.length],
      placeholderLabel: newPlaceholders.length > 1 ? `Photo #${idx + 1}` : "Tap to replace photo",
      isPlaceholder: true,
      stroke: "#FFF5F5",
      strokeWidth: 2,
    }));

    const overlay = previewData.templateJson.layoutJson.elements.find(
      (el: any) => el.id === "frame-cutout-overlay"
    ) || {
      id: "frame-cutout-overlay",
      type: "image",
      left: 0,
      top: 0,
      width: 1080,
      height: 1920,
      src: previewData.cutoutBase64,
      selectable: false,
      isPlaceholder: false,
    };
    newElements.push(overlay);

    setPreviewData({
      ...previewData,
      placeholders: newPlaceholders,
      templateJson: {
        ...previewData.templateJson,
        layoutJson: {
          ...previewData.templateJson.layoutJson,
          elements: newElements,
        },
      },
    });
  };

  const handleRecutFrame = async () => {
    if (!file || !previewData) return;
    await handleConvert(previewData.placeholders);
  };

  // Continue directly to the editor (scoped to current user session, stored via IndexedDB)
  const handleContinueToEditor = async () => {
    if (!previewData) return;
    setIsOpening(true);

    try {
      const templateId = `custom-${Date.now().toString(36)}`;
      const templateName = name.trim() || "My Story Template";

      const sessionTemplate: Template = {
        id: templateId,
        name: templateName,
        category: "Custom",
        description: "Personal custom story frame",
        tags: ["Custom", "Story"],
        accentColor: "#E2B4BD",
        thumbnailUrl: previewData.resizedOriginalBase64 || previewData.cutoutBase64,
        layoutJson: {
          ...previewData.templateJson.layoutJson,
          elements: previewData.templateJson.layoutJson.elements.map((el: any) =>
            el.id === "frame-cutout-overlay"
              ? { ...el, src: previewData.cutoutBase64 }
              : el
          ),
        },
      };

      // Store in IndexedDB with safe sessionStorage fallback (avoids 5MB quota errors)
      await saveTemplate(sessionTemplate);

      router.push(`/editor/${templateId}`);
    } catch (err: any) {
      console.error("Failed to open template in editor:", err);
      setErrorMsg("Could not load template into editor. Please try again.");
      setIsOpening(false);
    }
  };

  // Discard preview and pick another
  const handleDiscard = () => {
    setPreviewData(null);
    setFile(null);
    setFilePreview(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#140e13] text-[#FAF7F2] flex flex-col font-poppins selection:bg-[#E2B4BD] selection:text-[#181116] relative">
      {/* Mobile-only static atmospheric background (desktop remains 100% untouched) */}
      <div className="md:hidden fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <MobileAtmosphericBackground variant="ambient" className="h-full" />
      </div>

      <Navbar />

      {/* Hero Header */}
      <section className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#1c1219] via-[#140e13] to-[#140e13] text-[#FAF7F2] relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-[#F7D6D0]/10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-[#E2B4BD]/30 text-[#F7D6D0] text-xs font-semibold uppercase tracking-widest mb-3 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Studio Atelier &middot; 枠の創生</span>
          </div>

          <h1 className="font-playfair text-3xl sm:text-5xl font-bold tracking-tight text-[#FAF7F2] drop-shadow-md">
            Create Your Story Template
          </h1>

          <p className="mt-3 text-[#FAF7F2]/75 text-sm sm:text-base font-light max-w-2xl mx-auto">
            Upload any frame image, moodboard, or polaroid collage. Our visual analyzer automatically detects the photo slots so you can swap your own pictures inside.
          </p>
        </div>
      </section>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 relative z-10">
        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-3 text-sm backdrop-blur-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ----------------------------------------------------------- */}
          {/* LEFT PANEL: UPLOAD & SETTINGS FORM (5 cols)                 */}
          {/* ----------------------------------------------------------- */}
          <div className="lg:col-span-5 bg-white/[0.04] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 backdrop-blur-xl">
            <div>
              <h2 className="font-playfair text-xl font-bold text-[#FAF7F2]">
                1. Upload Frame Image
              </h2>
              <p className="text-xs text-[#FAF7F2]/60 mt-1 font-light">
                Upload any frame with photo spaces. Supports PNG, JPG, WebP.
              </p>
            </div>

            {/* Drag and drop upload target */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                file
                  ? "border-[#E2B4BD] bg-[#E2B4BD]/10"
                  : "border-white/20 hover:border-[#E2B4BD]/60 bg-white/[0.02] hover:bg-white/[0.05]"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                }}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />

              {filePreview ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-36 h-48 rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={filePreview}
                      alt="Uploaded frame preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs text-[#FAF7F2]/90 font-medium truncate max-w-xs">
                    {file?.name}
                  </div>
                  <span className="text-[11px] text-[#F7D6D0] font-semibold hover:underline">
                    Click to choose different image
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.06] text-[#F7D6D0] border border-white/10 flex items-center justify-center mb-1 shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-sm text-[#FAF7F2]">
                    Click to browse or drag image here
                  </span>
                  <p className="text-[11px] text-[#FAF7F2]/60">
                    Supports PNG, JPG, or WebP &bull; 1080&times;1920 recommended
                  </p>
                  <button
                    type="button"
                    className="mt-2 px-4 py-2 rounded-xl bg-white/[0.1] hover:bg-white/[0.18] text-[#FAF7F2] text-xs font-semibold transition-all flex items-center gap-1.5 border border-white/10"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Image File</span>
                  </button>
                </div>
              )}
            </div>

            {/* Template Design Guidelines & Rules */}
            <TemplateDesignGuidelines />

            {/* Template Name Input */}
            <div>
              <label className="text-xs font-semibold text-[#FAF7F2]/80 block mb-1.5">
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vintage Polaroid Collage"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/[0.05] text-[#FAF7F2] placeholder:text-[#FAF7F2]/30 text-xs focus:outline-none focus:border-[#E2B4BD] transition-colors"
              />
            </div>

            {/* Collapsible Advanced Settings */}
            <div className="border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs font-semibold text-[#FAF7F2]/70 hover:text-[#FAF7F2] transition-colors py-1"
              >
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#F7D6D0]" />
                  <span>Advanced Detection Settings</span>
                </div>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                  {/* Background Contrast Sensitivity */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-[#FAF7F2]/75">
                      <span>Contrast Sensitivity (Blurred/Frosted Slots)</span>
                      <span className="font-mono text-[#F7D6D0]">{contrastThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="70"
                      value={contrastThreshold}
                      onChange={(e) => setContrastThreshold(parseInt(e.target.value, 10))}
                      className="w-full accent-[#E2B4BD] cursor-pointer"
                    />
                  </div>

                  {/* Max Color Variance */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-[#FAF7F2]/75">
                      <span>Flat Color Variance (Solid Slots)</span>
                      <span className="font-mono text-[#F7D6D0]">&plusmn;{maxColorVariance}</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="40"
                      value={maxColorVariance}
                      onChange={(e) => setMaxColorVariance(parseInt(e.target.value, 10))}
                      className="w-full accent-[#E2B4BD] cursor-pointer"
                    />
                  </div>

                  {/* Min Width & Height */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-[#FAF7F2]/75">
                        <span>Min Width</span>
                        <span className="font-mono text-[#F7D6D0]">{minWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="400"
                        step="10"
                        value={minWidth}
                        onChange={(e) => setMinWidth(parseInt(e.target.value, 10))}
                        className="w-full accent-[#E2B4BD] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-[#FAF7F2]/75">
                        <span>Min Height</span>
                        <span className="font-mono text-[#F7D6D0]">{minHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="400"
                        step="10"
                        value={minHeight}
                        onChange={(e) => setMinHeight(parseInt(e.target.value, 10))}
                        className="w-full accent-[#E2B4BD] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Convert Trigger Button */}
            <button
              type="button"
              onClick={() => handleConvert()}
              disabled={!file || isConverting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#E2B4BD] to-[#F7D6D0] hover:brightness-105 text-[#181116] font-bold text-sm shadow-xl shadow-black/40 transition-all flex items-center justify-center gap-2 transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#181116]" />
                  <span>Analyzing Frame &amp; Detecting Slots...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#181116]" />
                  <span>Convert &amp; Detect Slots</span>
                </>
              )}
            </button>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* RIGHT PANEL: VISUAL DETECTION REVIEW (7 cols)               */}
          {/* ----------------------------------------------------------- */}
          <div className="lg:col-span-7 bg-white/[0.04] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 backdrop-blur-xl min-h-[500px]">
            <div>
              <h2 className="font-playfair text-xl font-bold text-[#FAF7F2]">
                2. Visual Detection Review
              </h2>
              <p className="text-xs text-[#FAF7F2]/60 mt-1 font-light">
                Inspect detected photo slots and review the generated transparent cutout frame.
              </p>
            </div>

            {previewData ? (
              <div className="flex flex-col gap-6">
                {/* Tab Navigation */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("overlay")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        activeTab === "overlay"
                          ? "bg-white/[0.14] text-[#FAF7F2] border border-white/20 shadow-sm"
                          : "text-[#FAF7F2]/60 hover:text-[#FAF7F2] hover:bg-white/[0.06]"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Overlay Slots ({previewData.placeholders.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("cutout")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        activeTab === "cutout"
                          ? "bg-white/[0.14] text-[#FAF7F2] border border-white/20 shadow-sm"
                          : "text-[#FAF7F2]/60 hover:text-[#FAF7F2] hover:bg-white/[0.06]"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Cutout Frame PNG</span>
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-[#FAF7F2]/50">
                    {previewData.dimensions.width}&times;{previewData.dimensions.height}
                  </span>
                </div>

                {/* Visual Viewport Area */}
                <div className="flex justify-center bg-black/50 rounded-2xl p-4 sm:p-6 overflow-hidden border border-white/10 shadow-inner">
                  {activeTab === "overlay" && (
                    <div
                      className="relative rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-black"
                      style={{
                        width: "280px",
                        height: "498px",
                      }}
                    >
                      {/* Resized Base Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewData.resizedOriginalBase64}
                        alt="Resized Reference Frame"
                        className="w-full h-full object-cover"
                      />

                      {/* Render Colored Bounding Boxes over detected slots */}
                      {previewData.placeholders.map((slot, idx) => {
                        const scaleW = 280 / previewData.dimensions.width;
                        const scaleH = 498 / previewData.dimensions.height;

                        return (
                          <div
                            key={idx}
                            style={{
                              left: `${slot.x * scaleW}px`,
                              top: `${slot.y * scaleH}px`,
                              width: `${slot.width * scaleW}px`,
                              height: `${slot.height * scaleH}px`,
                            }}
                            className="absolute border-2 border-emerald-400 bg-emerald-500/25 flex flex-col items-center justify-center text-center p-1 pointer-events-none shadow-sm animate-pulse"
                          >
                            <span className="text-[10px] font-mono font-bold text-white bg-black/80 px-1.5 py-0.5 rounded shadow">
                              Slot #{idx + 1}
                            </span>
                            <span className="text-[8px] font-mono text-white/90 drop-shadow">
                              {slot.width}&times;{slot.height}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === "cutout" && (
                    <div
                      className="relative rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-[repeating-conic-gradient(#201820_0%_25%,#352430_0%_50%)] [background-size:16px_16px]"
                      style={{
                        width: "280px",
                        height: "498px",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewData.cutoutBase64}
                        alt="Transparent Cutout Frame"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Slot Manager: Fine-tune or remove slots */}
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#FAF7F2] uppercase tracking-wider">
                        Detected Photo Slots ({previewData.placeholders.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddSlot}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] text-[#FAF7F2] text-[11px] font-semibold flex items-center gap-1 transition-all border border-white/10"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Slot</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRecutFrame}
                        className="px-2.5 py-1 rounded-lg bg-[#E2B4BD]/20 hover:bg-[#E2B4BD]/30 text-[#F7D6D0] text-[11px] font-semibold flex items-center gap-1 transition-all border border-[#E2B4BD]/30"
                        title="Re-cut transparent holes according to updated coordinates"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Re-cut Holes</span>
                      </button>
                    </div>
                  </div>

                  {previewData.placeholders.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                      No photo slots detected yet. Try adjusting Contrast Sensitivity on the left or click &quot;Add Slot&quot; to position one manually.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {previewData.placeholders.map((slot, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-white/[0.1] text-[#FAF7F2] flex items-center justify-center font-mono font-bold text-[10px] border border-white/15">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-[#FAF7F2] text-xs">
                              Slot #{idx + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-mono">
                            <span className="text-[#FAF7F2]/60">
                              {slot.width}&times;{slot.height}px
                            </span>
                            <span className="text-[#F7D6D0]">
                              ({(slot.width / slot.height).toFixed(2)}:1)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(idx)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Delete this slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Primary Action Button: Continue to Editor */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleContinueToEditor}
                    disabled={isOpening}
                    className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#E2B4BD] to-[#F7D6D0] hover:brightness-105 text-[#181116] font-bold text-sm shadow-xl shadow-black/40 transition-all flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer"
                  >
                    {isOpening ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#181116]" />
                        <span>Opening in Editor...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Editor</span>
                        <ArrowRight className="w-4 h-4 text-[#181116]" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="px-4 py-3 rounded-2xl border border-white/20 text-[#FAF7F2]/80 hover:text-[#FAF7F2] hover:bg-white/[0.06] text-xs font-semibold transition-all w-full sm:w-auto"
                  >
                    Upload Different Frame
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/10 rounded-2xl my-auto">
                <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#F7D6D0] mb-3">
                  <ImageIcon className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="font-semibold text-sm text-[#FAF7F2]">
                  No preview generated yet
                </h3>
                <p className="text-xs text-[#FAF7F2]/60 max-w-sm mt-1 font-light">
                  Upload a frame image on the left and click &quot;Convert &amp; Detect Slots&quot; to review the detected photo spaces.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Starter Inspiration Strip */}
        <section className="mt-16 pt-12 border-t border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-playfair text-xl font-bold text-[#FAF7F2]">
                Starter Examples &amp; Inspiration
              </h3>
              <p className="text-xs text-[#FAF7F2]/60 mt-0.5 font-light">
                Don&apos;t have a frame image right now? Try one of these pre-built sample templates:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {starterTemplates.map((t) => (
              <div
                key={t.id}
                className="group p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#E2B4BD]/40 shadow-xl transition-all flex flex-col justify-between backdrop-blur-md"
              >
                <div>
                  <h4 className="font-playfair font-bold text-base text-[#FAF7F2] group-hover:text-[#F7D6D0] transition-colors">
                    {t.name}
                  </h4>
                  <p className="text-xs text-[#FAF7F2]/60 line-clamp-2 mt-1 font-light">
                    {t.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-white/[0.06] text-[#F7D6D0] border border-white/10">
                    {t.category}
                  </span>

                  <Link
                    href={`/editor/${t.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E2B4BD] hover:text-[#FAF7F2] transition-colors"
                  >
                    <span>Open in Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
