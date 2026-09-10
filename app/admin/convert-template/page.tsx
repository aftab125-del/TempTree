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
  Code,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Info,
  Check,
  Copy,
  Plus,
} from "lucide-react";
import { Category, CATEGORIES } from "@/types/template";
import { DetectedSlot } from "@/lib/frame-converter";

interface PreviewData {
  placeholders: DetectedSlot[];
  dimensions: { width: number; height: number };
  originalDimensions: { width: number; height: number };
  resizedOriginalBase64: string;
  cutoutBase64: string;
  templateJson: any;
}

export default function AdminConvertTemplatePage() {
  const router = useRouter();

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [id, setId] = useState<string>("");
  const [category, setCategory] = useState<Category>("Minimal");
  const [description, setDescription] = useState<string>("");

  // Advanced Options State
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [maxColorVariance, setMaxColorVariance] = useState<number>(15);
  const [minWidth, setMinWidth] = useState<number>(160);
  const [minHeight, setMinHeight] = useState<number>(180);
  const [contrastThreshold, setContrastThreshold] = useState<number>(28);
  const [detectPlusIcon, setDetectPlusIcon] = useState<boolean>(true);

  // Conversion & Save States
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [activeTab, setActiveTab] = useState<"overlay" | "cutout" | "json">("overlay");
  const [savedResult, setSavedResult] = useState<{ id: string } | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate template ID from name and category
  const handleNameChange = (val: string) => {
    setName(val);
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (slug) {
      setId(`${category.toLowerCase()}-${slug}`);
    }
  };

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    if (name) {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setId(`${cat.toLowerCase()}-${slug}`);
    }
  };

  // Handle image selection via input or drag-and-drop
  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setErrorMsg("Please select an image file (PNG, JPG, WebP).");
      return;
    }
    setErrorMsg(null);
    setSavedResult(null);
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
      handleNameChange(cleanName);
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

  // Run Conversion (Preview in Memory)
  const handleConvert = async (manualSlotsOverride?: DetectedSlot[]) => {
    if (!file) {
      setErrorMsg("Please upload a reference frame image first.");
      return;
    }

    setIsConverting(true);
    setErrorMsg(null);
    setSavedResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id", id || `frame-${category.toLowerCase()}-${Date.now().toString(36)}`);
      formData.append("name", name || "Custom Aesthetic Frame");
      formData.append("category", category);
      formData.append("description", description);
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

  // ============================================================================
  // MANUAL SLOT MANAGEMENT & RE-CUTTING
  // ============================================================================
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
      placeholderLabel: newPlaceholders.length > 1 ? `Replace Photo #${idx + 1}` : "Tap to replace photo",
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
      src: `/frames/${id}-frame.png`,
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
      rotation: 0,
      cx: 140 + 400,
      cy: 360 + (previewData.placeholders.length % 4) * 120 + 300,
    };

    const newPlaceholders = [...previewData.placeholders, newSlot];

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
      angle: p.rotation || 0,
      rotation: p.rotation || 0,
      cx: p.cx != null ? p.cx : p.x + p.width / 2,
      cy: p.cy != null ? p.cy : p.y + p.height / 2,
      src: samplePhotos[idx % samplePhotos.length],
      placeholderLabel: newPlaceholders.length > 1 ? `Replace Photo #${idx + 1}` : "Tap to replace photo",
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
      src: `/frames/${id}-frame.png`,
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

  // Save to Library (Commit PNG and templates.json)
  const handleSaveToLibrary = async () => {
    if (!previewData) return;

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/admin/convert-frame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateJson: previewData.templateJson,
          cutoutBase64: previewData.cutoutBase64,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save template to library");
      }

      const templateId = previewData.templateJson.id;
      setSavedResult({ id: templateId });
      // Directly open the editor page for this template
      router.push(`/editor/${templateId}`);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving the template.");
    } finally {
      setIsSaving(false);
    }
  };

  // Discard Preview
  const handleDiscard = () => {
    setPreviewData(null);
    setSavedResult(null);
    setErrorMsg(null);
  };

  const handleCopyJson = () => {
    if (!previewData) return;
    navigator.clipboard.writeText(JSON.stringify(previewData.templateJson, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  return (
    <div className="min-h-screen bg-blushWhite text-charcoal flex flex-col font-poppins selection:bg-dustyMauve selection:text-blushWhite">
      {/* Top Header Bar */}
      <header className="bg-charcoal text-blushWhite border-b border-dustyMauve/20 py-4 px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-xl bg-dustyMauve/30 border border-peachPink/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-peachPink" />
            </div>
            <div>
              <h1 className="font-playfair text-xl font-bold tracking-tight text-blushWhite">
                TempTree Template Studio
              </h1>
              <p className="text-[11px] text-blushWhite/70 font-light">
                Upload Frame &rarr; Instant Story Template
              </p>
            </div>
          </Link>

          <div className="flex items-center space-x-4 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-light/60 border border-dustyMauve/30 text-peachPink">
              <Sparkles className="w-3.5 h-3.5" /> Auto-Slot Detection
            </span>
            <Link
              href="/"
              className="text-blushWhite/80 hover:text-blushWhite transition-colors underline"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Notification */}
        {savedResult && (
          <div className="mb-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Template Saved to Library!</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  ID: <code className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded">{savedResult.id}</code> &bull; Frame PNG saved in public/frames/
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/editor/${savedResult.id}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex-1 sm:flex-none"
              >
                <span>Open in Editor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={handleDiscard}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal/10 hover:bg-charcoal/20 text-charcoal text-xs font-medium transition-all"
              >
                Convert Another
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ----------------------------------------------------------- */}
          {/* LEFT PANEL: UPLOAD & SETTINGS FORM (4 cols)                 */}
          {/* ----------------------------------------------------------- */}
          <div className="lg:col-span-5 bg-charcoal/5 border border-charcoal/15 rounded-3xl p-6 shadow-sm flex flex-col gap-6 backdrop-blur-sm">
            <div>
              <h2 className="font-playfair text-xl font-bold text-charcoal">
                1. Upload Template Frame
              </h2>
              <p className="text-xs text-charcoal/70 mt-1 font-light">
                Drop any frame image or design layout. Our visual analyzer will automatically detect the photo windows.
              </p>
            </div>

            {/* Drag and drop upload target */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                file
                  ? "border-dustyMauve bg-dustyMauve/10"
                  : "border-charcoal/30 hover:border-dustyMauve bg-charcoal/5 hover:bg-dustyMauve/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {filePreview ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-32 aspect-[9/16] rounded-lg overflow-hidden border border-charcoal/20 shadow-md mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={filePreview}
                      alt="Uploaded frame reference"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-medium text-charcoal truncate max-w-xs">
                    {file?.name}
                  </p>
                  <p className="text-[10px] text-charcoal/60 mt-0.5 mb-2">
                    Click or drag to change image
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal/10 hover:bg-charcoal/20 text-charcoal text-[11px] font-medium transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    Replace Image
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-dustyMauve/30 border border-peachPink/40 flex items-center justify-center text-charcoal mb-3">
                    <Upload className="w-6 h-6 text-charcoal" />
                  </div>
                  <p className="text-sm font-semibold text-charcoal">
                    Click to browse or drag image here
                  </p>
                  <p className="text-[11px] text-charcoal/60 mt-1 mb-3">
                    Supports PNG, JPG, or WebP &bull; 1080&times;1920 recommended
                  </p>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal text-blushWhite hover:bg-charcoal-light text-xs font-semibold shadow-sm transition-all pointer-events-none">
                    <Upload className="w-3.5 h-3.5 text-peachPink" />
                    Choose Image File
                  </span>
                </div>
              )}
            </div>

            {/* Template Metadata Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cyber Sparkle 2000"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-charcoal/20 focus:border-dustyMauve focus:ring-2 focus:ring-dustyMauve/20 text-xs font-poppins text-charcoal outline-none transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as Category)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-charcoal/20 focus:border-dustyMauve focus:ring-2 focus:ring-dustyMauve/20 text-xs font-poppins text-charcoal outline-none transition-all shadow-sm cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Template ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. minimal-grid-01"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-charcoal/20 focus:border-dustyMauve focus:ring-2 focus:ring-dustyMauve/20 text-xs font-mono text-charcoal outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Description <span className="text-[10px] text-charcoal/60">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Brief aesthetic description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-charcoal/20 focus:border-dustyMauve focus:ring-2 focus:ring-dustyMauve/20 text-xs font-poppins text-charcoal outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Collapsible Advanced Detection Settings */}
            <div className="border border-charcoal/15 rounded-2xl overflow-hidden bg-white/70 shadow-sm">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-charcoal hover:bg-charcoal/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-dustyMauve" />
                  <span>Advanced Detection Settings</span>
                </div>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 text-charcoal/60" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-charcoal/60" />
                )}
              </button>

              {showAdvanced && (
                <div className="p-4 pt-1 border-t border-charcoal/10 space-y-3.5 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-charcoal">
                        Color Variance Tolerance (0–50)
                      </label>
                      <span className="font-mono text-dustyMauve font-bold">
                        {maxColorVariance}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={50}
                      value={maxColorVariance}
                      onChange={(e) => setMaxColorVariance(parseInt(e.target.value, 10))}
                      className="w-full accent-dustyMauve cursor-pointer"
                    />
                    <p className="text-[10px] text-charcoal/60 mt-0.5">
                      Default: 15. Internal tolerance for solid flat blocks.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-medium text-charcoal">
                        Background Contrast Sensitivity
                      </label>
                      <span className="font-mono text-dustyMauve font-semibold">
                        &Delta; {contrastThreshold}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={70}
                      value={contrastThreshold}
                      onChange={(e) => setContrastThreshold(parseInt(e.target.value, 10))}
                      className="w-full accent-dustyMauve cursor-pointer"
                    />
                    <p className="text-[10px] text-charcoal/60 mt-0.5">
                      Default: 28. Detects blurred, gradient, or frosted photo windows distinct from border color.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-charcoal mb-1">
                        Min Width (px)
                      </label>
                      <input
                        type="number"
                        min={50}
                        max={1000}
                        value={minWidth}
                        onChange={(e) => setMinWidth(parseInt(e.target.value, 10) || 160)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-charcoal/20 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-charcoal mb-1">
                        Min Height (px)
                      </label>
                      <input
                        type="number"
                        min={50}
                        max={1000}
                        value={minHeight}
                        onChange={(e) => setMinHeight(parseInt(e.target.value, 10) || 180)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-charcoal/20 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="detectPlus"
                      checked={detectPlusIcon}
                      onChange={(e) => setDetectPlusIcon(e.target.checked)}
                      className="rounded text-dustyMauve focus:ring-dustyMauve"
                    />
                    <label htmlFor="detectPlus" className="text-xs text-charcoal cursor-pointer">
                      Scan center for &ldquo;+&rdquo; add-photo glyph
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Convert Button */}
            <button
              onClick={() => handleConvert()}
              disabled={!file || isConverting}
              className={`w-full py-3.5 rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                !file || isConverting
                  ? "bg-charcoal/30 text-blushWhite/50 cursor-not-allowed"
                  : "bg-charcoal text-blushWhite hover:bg-charcoal-light active:scale-[0.99] shadow-charcoal/20"
              }`}
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-peachPink" />
                  <span>Scanning &amp; Converting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-peachPink" />
                  <span>Convert Template</span>
                </>
              )}
            </button>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* RIGHT PANEL: IMMEDIATE VISUAL REVIEW & CONFIRMATION (7 cols) */}
          {/* ----------------------------------------------------------- */}
          <div className="lg:col-span-7 bg-charcoal/5 border border-charcoal/15 rounded-3xl p-6 shadow-sm flex flex-col gap-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-charcoal/10">
              <div>
                <h2 className="font-playfair text-xl font-bold text-charcoal">
                  2. Visual Detection Review
                </h2>
                <p className="text-xs text-charcoal/70 mt-0.5 font-light">
                  Verify detected slots and transparent cutout before saving.
                </p>
              </div>

              {previewData && (
                <div className="flex items-center p-1 bg-charcoal/10 rounded-xl text-xs font-medium">
                  <button
                    onClick={() => setActiveTab("overlay")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === "overlay"
                        ? "bg-white text-charcoal shadow-sm font-semibold"
                        : "text-charcoal/70 hover:text-charcoal"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-dustyMauve" />
                      Slot Overlay
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("cutout")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === "cutout"
                        ? "bg-white text-charcoal shadow-sm font-semibold"
                        : "text-charcoal/70 hover:text-charcoal"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-peachPink" />
                      Cutout Frame
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("json")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === "json"
                        ? "bg-white text-charcoal shadow-sm font-semibold"
                        : "text-charcoal/70 hover:text-charcoal"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-charcoal" />
                      JSON
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Empty State when no conversion yet */}
            {!previewData && (
              <div className="py-24 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-dustyMauve/20 border border-dustyMauve/40 flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-dustyMauve opacity-60" />
                </div>
                <h3 className="font-playfair text-lg font-bold text-charcoal mb-1">
                  No preview generated yet
                </h3>
                <p className="text-xs text-charcoal/60 max-w-sm">
                  Upload a reference frame image on the left and click &ldquo;Convert Template&rdquo; to visually inspect detected placeholder slots and transparency cutouts.
                </p>
              </div>
            )}

            {/* Active Preview View */}
            {previewData && (
              <div className="space-y-6">
                {/* ----------------------------------------------------- */}
                {/* TAB 1: Slot Overlay View                              */}
                {/* ----------------------------------------------------- */}
                {activeTab === "overlay" && (
                  <div className="flex flex-col items-center">
                    <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-2 border-dustyMauve/40 bg-charcoal">
                      {/* Resized Original Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewData.resizedOriginalBase64}
                        alt="Original frame with slot overlays"
                        className="w-full h-full object-cover pointer-events-none select-none"
                      />

                      {/* Render absolute bounding box for each detected slot */}
                      {previewData.placeholders.map((slot, index) => {
                        const leftPercent = (slot.x / 1080) * 100;
                        const topPercent = (slot.y / 1920) * 100;
                        const widthPercent = (slot.width / 1080) * 100;
                        const heightPercent = (slot.height / 1920) * 100;

                        return (
                          <div
                            key={index}
                            style={{
                              left: `${leftPercent}%`,
                              top: `${topPercent}%`,
                              width: `${widthPercent}%`,
                              height: `${heightPercent}%`,
                            }}
                            className="absolute border-2 border-peachPink bg-dustyMauve/35 backdrop-blur-[0.5px] rounded-lg flex flex-col items-center justify-center p-1 shadow-md transition-transform hover:scale-[1.01]"
                          >
                            <div className="bg-charcoal/90 text-blushWhite px-2 py-0.5 rounded-full text-[10px] font-bold shadow mb-1">
                              Slot #{index + 1}
                            </div>
                            <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded text-[9px] text-blushWhite/90 font-mono">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/50 flex-shrink-0"
                                style={{ backgroundColor: slot.color }}
                              />
                              <span>{slot.width}&times;{slot.height}</span>
                            </div>
                            {slot.hasPlusIcon && (
                              <span className="mt-1 bg-peachPink text-charcoal text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                                + Plus Icon
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-charcoal/70 mt-3 text-center">
                      Found <strong className="text-charcoal">{previewData.placeholders.length}</strong> placeholder slot(s). Green/peach boxes indicate where user photos will sit.
                    </p>
                  </div>
                )}

                {/* ----------------------------------------------------- */}
                {/* TAB 2: Cutout Transparency View                       */}
                {/* ----------------------------------------------------- */}
                {activeTab === "cutout" && (
                  <div className="flex flex-col items-center">
                    {/* Checkerboard transparency container */}
                    <div
                      className="relative w-full max-w-[340px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-2 border-peachPink/50"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #2A2A2A 25%, transparent 25%),
                          linear-gradient(-45deg, #2A2A2A 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #2A2A2A 75%),
                          linear-gradient(-45deg, transparent 75%, #2A2A2A 75%)
                        `,
                        backgroundSize: "20px 20px",
                        backgroundColor: "#1C1C1C",
                      }}
                    >
                      {/* Transparent Cutout Frame PNG */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewData.cutoutBase64}
                        alt="Transparent cutout frame preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <p className="text-[11px] text-charcoal/70 mt-3 text-center">
                      The checkerboard pattern shows the transparent holes punched out for photo placement.
                    </p>
                  </div>
                )}

                {/* ----------------------------------------------------- */}
                {/* TAB 3: Formatted JSON Recipe Inspector                */}
                {/* ----------------------------------------------------- */}
                {activeTab === "json" && (
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-charcoal">
                        Generated Template JSON (data/templates.json)
                      </span>
                      <button
                        onClick={handleCopyJson}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-charcoal/80 hover:text-charcoal bg-white border border-charcoal/20 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                      >
                        {copiedJson ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 rounded-2xl bg-charcoal text-blushWhite font-mono text-[11px] overflow-x-auto max-h-[420px] shadow-inner border border-dustyMauve/30">
                      {JSON.stringify(previewData.templateJson, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Slot Details & Manual Adjustment Panel */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                        Configured Photo Slots ({previewData.placeholders.length})
                      </h3>
                      <p className="text-[11px] text-charcoal/60">
                        Fine-tune dimensions or add/remove placeholder slots.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddSlot}
                        className="px-2.5 py-1.5 rounded-xl bg-dustyMauve/20 hover:bg-dustyMauve/30 text-charcoal text-xs font-medium flex items-center gap-1 border border-dustyMauve/40 transition-colors"
                        title="Add a custom photo slot"
                      >
                        <Plus className="w-3.5 h-3.5 text-dustyMauve" />
                        <span>Add Slot</span>
                      </button>

                      <button
                        onClick={handleRecutFrame}
                        disabled={isConverting}
                        className="px-2.5 py-1.5 rounded-xl bg-charcoal/10 hover:bg-charcoal/20 text-charcoal text-xs font-medium flex items-center gap-1 border border-charcoal/20 transition-colors"
                        title="Punch holes in the frame cutout for updated slot coordinates"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isConverting ? "animate-spin text-dustyMauve" : ""}`} />
                        <span>Re-cut Frame</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewData.placeholders.map((slot, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-white border border-charcoal/15 shadow-sm space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-charcoal/20 flex-shrink-0"
                              style={{ backgroundColor: slot.color }}
                            />
                            <span className="font-bold text-charcoal">Slot #{idx + 1}</span>
                            <span className="font-mono text-[10px] text-charcoal/50">
                              ({(slot.width / slot.height).toFixed(2)} : 1)
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteSlot(idx)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title={`Delete Slot #${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Interactive Coordinate Grid */}
                        <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                          <div>
                            <label className="text-charcoal/60 block mb-0.5">X</label>
                            <input
                              type="number"
                              value={slot.x}
                              onChange={(e) =>
                                handleUpdateSlot(idx, { x: parseInt(e.target.value, 10) || 0 })
                              }
                              className="w-full px-1.5 py-1 rounded bg-charcoal/5 border border-charcoal/15 font-mono text-charcoal text-center"
                            />
                          </div>
                          <div>
                            <label className="text-charcoal/60 block mb-0.5">Y</label>
                            <input
                              type="number"
                              value={slot.y}
                              onChange={(e) =>
                                handleUpdateSlot(idx, { y: parseInt(e.target.value, 10) || 0 })
                              }
                              className="w-full px-1.5 py-1 rounded bg-charcoal/5 border border-charcoal/15 font-mono text-charcoal text-center"
                            />
                          </div>
                          <div>
                            <label className="text-charcoal/60 block mb-0.5">Width</label>
                            <input
                              type="number"
                              value={slot.width}
                              onChange={(e) =>
                                handleUpdateSlot(idx, { width: parseInt(e.target.value, 10) || 50 })
                              }
                              className="w-full px-1.5 py-1 rounded bg-charcoal/5 border border-charcoal/15 font-mono text-charcoal text-center"
                            />
                          </div>
                          <div>
                            <label className="text-charcoal/60 block mb-0.5">Height</label>
                            <input
                              type="number"
                              value={slot.height}
                              onChange={(e) =>
                                handleUpdateSlot(idx, { height: parseInt(e.target.value, 10) || 50 })
                              }
                              className="w-full px-1.5 py-1 rounded bg-charcoal/5 border border-charcoal/15 font-mono text-charcoal text-center"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirmation Actions Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-charcoal/10">
                  <button
                    onClick={handleSaveToLibrary}
                    disabled={isSaving}
                    className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving to Library...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save to Library</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDiscard}
                    disabled={isSaving}
                    className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-charcoal/10 hover:bg-red-500/10 text-charcoal hover:text-red-700 border border-charcoal/20 hover:border-red-500/30 text-xs font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Discard</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
