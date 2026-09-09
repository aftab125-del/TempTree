"use client";

import React from "react";
import { FAQ8, FAQItem } from "@/components/ui/faq-8";

const TEMPTREE_FAQ_ITEMS: FAQItem[] = [
  {
    id: "slot-detection-how",
    question: "How does automatic slot detection find photo placeholders?",
    category: "Slot Detection",
    answer:
      "Our in-browser computer vision engine scans your uploaded frame image for transparent cutout regions (alpha channel analysis) and high-contrast placeholder shapes. It calculates the exact bounding coordinates, rotation angle, and aspect ratio (like 4:5 portrait, 1:1 square, or 9:16 full-bleed), generating ready-to-fill drop zones beneath your frame artwork.",
  },
  {
    id: "privacy-zero-server",
    question: "Are my uploaded frames or photos stored on a server?",
    category: "Privacy",
    answer:
      "Never. TempTree operates 100% locally in your web browser using client-side HTML5 Canvas and Fabric.js. Your family photos, private snapshots, and original artwork are processed in memory and never transmitted or saved to any external cloud database.",
  },
  {
    id: "formats-supported",
    question: "What file formats work best for custom frame templates?",
    category: "Templates",
    answer:
      "PNG images with transparent cutouts yield the fastest, pixel-perfect results. TempTree also supports high-resolution JPGs and WebP images—our vision engine detects solid-color placeholder rectangles (such as white or pastel frames) and automatically turns them into editable photo slots.",
  },
  {
    id: "manual-adjustments",
    question: "Can I manually adjust, scale, or reposition detected photo slots?",
    category: "Editor",
    answer:
      "Absolutely. Once your frame is analyzed, you can open it in the TempTree editor to scale, rotate, nudge, reorder layers, or add extra photo placeholders with full drag-and-drop precision before exporting.",
  },
  {
    id: "export-quality",
    question: "What resolution and format is the final exported story?",
    category: "Export",
    answer:
      "All stories export in lossless 1080×1920 HD PNG format (the native 9:16 Instagram Story standard). The rendering pipeline renders at 1:1 pixel density with crisp edge antialiasing, ensuring clean, razor-sharp output on modern smartphone retina displays.",
  },
  {
    id: "no-account-required",
    question: "Do I need to sign up or create an account to use TempTree?",
    category: "Templates",
    answer:
      "No account, login, or subscription required. TempTree is completely free and frictionless: upload your frame, insert your photos, and download your finished Instagram Story instantly.",
  },
  {
    id: "photo-crop-fitting",
    question: "How does smart photo fitting work when I insert my photos?",
    category: "Editor",
    answer:
      "When you drop an image into any detected slot, TempTree automatically centers and fits the photo using object-fit cover logic. You can then pan the photo within the slot, adjust scale, or rotate it so your subject is framed perfectly.",
  },
];

export const FAQSection: React.FC = () => {
  return (
    <section id="faq" className="w-full relative z-10">
      <FAQ8
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about uploading frames, automatic slot detection, and exporting high-resolution stories."
        placeholder="Search questions, slots, exports, privacy, formats..."
        items={TEMPTREE_FAQ_ITEMS}
      />
    </section>
  );
};

export default FAQSection;
