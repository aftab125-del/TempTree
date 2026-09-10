"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

export interface TemplateDesignGuidelinesProps {
  compact?: boolean;
}

export default function TemplateDesignGuidelines({
  compact = false,
}: TemplateDesignGuidelinesProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Inline Guidelines Card */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all text-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#E2B4BD]/20 text-[#F7D6D0] flex items-center justify-center font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-[#FAF7F2]">
              Photo Slot Guidelines
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            For 100% Accuracy
          </span>
        </div>

        <p className="text-[#FAF7F2]/70 text-[11px] leading-relaxed">
          For flawless automatic cutout detection, follow these simple rules when creating your template frame:
        </p>

        <ul className="space-y-2 text-[11px] text-[#FAF7F2]/80">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#FAF7F2]">Use solid black placeholders:</strong> The area where photos go should be pure black (<code className="text-[#F7D6D0] bg-white/[0.05] px-1 py-0.5 rounded">#000000</code>) or dark flat color.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#FAF7F2]">No &quot;Add photo&quot; text:</strong> Do not write placeholder text inside the photo opening.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#FAF7F2]">No &quot;+&quot; or icons:</strong> Avoid plus signs, camera icons, or crosshairs inside the slot.
            </span>
          </li>
        </ul>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-1 w-full py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[#F7D6D0] hover:text-[#FAF7F2] font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>See Visual Examples (Do&apos;s &amp; Don&apos;ts)</span>
        </button>
      </div>

      {/* Visual Examples Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#1a1218] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto flex flex-col gap-6 text-[#FAF7F2]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] text-[#F7D6D0] text-[10px] font-mono uppercase tracking-wider mb-2 border border-white/10">
                  <Lightbulb className="w-3 h-3 text-[#F7D6D0]" />
                  Template Creator Guide
                </div>
                <h3 className="font-playfair text-2xl font-bold text-[#FAF7F2]">
                  Template Preparation: Do&apos;s &amp; Don&apos;ts
                </h3>
                <p className="text-xs text-[#FAF7F2]/60 mt-1">
                  How to prepare your Instagram story frames for seamless automatic slot cutout detection.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.15] text-[#FAF7F2]/70 hover:text-[#FAF7F2] transition-colors border border-white/10"
                aria-label="Close guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: DON'T - Text Inside Slot */}
              <div className="rounded-2xl bg-rose-950/20 border border-rose-500/30 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400">
                    <XCircle className="w-4 h-4" />
                    DON&apos;T: Text Inside Slot
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
                    Avoid
                  </span>
                </div>

                <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden bg-black border border-rose-500/30 shadow-inner group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/guidelines/dont-add-photo-text.jpg"
                    alt="Avoid: Template with Add Photo text inside slots"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                    <span className="text-[10px] text-rose-200 font-medium">
                      &quot;Add photo&quot; text breaks detection
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#FAF7F2]/75 leading-snug">
                  Writing <strong className="text-rose-300">&quot;Add photo&quot;</strong> inside the placeholder interrupts flat color consistency. The detector leaves text artifacts in the cutout overlay.
                </p>
              </div>

              {/* Card 2: DON'T - Plus Icon & White Slot */}
              <div className="rounded-2xl bg-rose-950/20 border border-rose-500/30 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400">
                    <XCircle className="w-4 h-4" />
                    DON&apos;T: &quot;+&quot; Icon / Light Slots
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
                    Avoid
                  </span>
                </div>

                <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden bg-black border border-rose-500/30 shadow-inner group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/guidelines/dont-white-plus-slot.jpg"
                    alt="Avoid: Template with plus icon and white slot"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                    <span className="text-[10px] text-rose-200 font-medium">
                      Plus icons fragment the slot
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#FAF7F2]/75 leading-snug">
                  Adding <strong className="text-rose-300">&quot;+&quot; icons</strong> or white/light slots confuses contrast detection. Clean cutout holes cannot be punched cleanly around icons.
                </p>
              </div>

              {/* Card 3: DO - Clean Solid Black Slot */}
              <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    DO: Solid Black Slots
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                    Perfect
                  </span>
                </div>

                <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden bg-black border border-emerald-500/30 shadow-inner group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/guidelines/do-solid-black-slots.jpg"
                    alt="Do: Template with solid black placeholders"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                    <span className="text-[10px] text-emerald-200 font-medium">
                      100% clean cutout punch
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#FAF7F2]/75 leading-snug">
                  Fill photo spaces with <strong className="text-emerald-300">solid flat black</strong> (<code className="text-[#F7D6D0] bg-white/[0.05] px-1 py-0.5 rounded">#000000</code>). The engine detects exact bounds and rotation angles automatically.
                </p>
              </div>
            </div>

            {/* Creator Tips Banner */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-[#F7D6D0] flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#FAF7F2]/80">
                  <strong className="text-[#FAF7F2] block mb-0.5">Quick Canva / Photoshop Tip:</strong>
                  Export your frame as a <strong>1080&times;1920 PNG or high-quality JPG</strong>. Simply add black rectangles for where photos belong, decorate the rest freely, and export!
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E2B4BD] to-[#F7D6D0] text-[#181116] font-bold text-xs hover:brightness-105 transition-all flex-shrink-0 cursor-pointer"
              >
                Got it, let&apos;s upload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
