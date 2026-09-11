"use client";

import React, { useState } from "react";
import { X, Download, Share2, Check, Sparkles, Image as ImageIcon } from "lucide-react";

interface MobileExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  filename: string;
}

export default function MobileExportModal({
  isOpen,
  onClose,
  imageUrl,
  filename,
}: MobileExportModalProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !imageUrl) return null;

  // Trigger Native Web Share (opens iOS / Android share sheet with "Save Image")
  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "TempTree Story",
            text: "Created with TempTree Story Atelier",
          });
          setIsSharing(false);
          return;
        }
      }
      // Fallback if file sharing not supported: download directly
      await handleDownload();
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Share failed, falling back to download:", err);
        await handleDownload();
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Trigger Blob Download (robust against mobile browser base64 truncation)
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Tap backdrop to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Surface */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#181318]/95 border border-dustyPink/30 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-cream max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-dustyPink/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-mauve/25 border border-dustyPink/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-peachPink" />
            </div>
            <div>
              <h2 className="font-playfair text-base font-bold text-cream leading-tight">
                Story Ready!
              </h2>
              <p className="text-[10px] text-dustyPink font-mono">
                1080 &times; 1920 HD PNG
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-plum/60 hover:bg-plum border border-dustyPink/20 text-cream/70 hover:text-cream flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
            aria-label="Close export dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Preview Container */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-dustyPink/30 bg-black/70 max-h-[42vh] aspect-[9/16]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Rendered Story"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Long-press helper tip */}
          <p className="mt-2 text-[10px] text-dustyPink/80 text-center leading-relaxed">
            ✦ Tip: You can also tap &amp; hold the image above to save directly to your Photos.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Share / Save to Camera Roll */}
          <button
            type="button"
            onClick={handleShare}
            disabled={isSharing}
            className="w-full min-h-[46px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-dustyPink via-peachPink to-cream text-plum font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-105 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSharing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-plum" />
                <span>Preparing Share...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-plum" />
                <span>Share &bull; Save to Photos</span>
              </>
            )}
          </button>

          {/* Download PNG File */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-2xl bg-plum/70 hover:bg-plum border border-dustyPink/30 text-cream font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Downloaded to Device!</span>
              </>
            ) : isDownloading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-dustyPink" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-dustyPink" />
                <span>Download PNG File</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
