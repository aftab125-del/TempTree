"use client";

import React from "react";
import { CTA5 } from "@/components/ui/cta-5";

export const FinalCTASection: React.FC = () => {
  return (
    <section id="cta" className="relative z-10 w-full overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-peachPink/5 rounded-full blur-3xl pointer-events-none" />

      <CTA5
        badge="YOUR FRAMES, ELEVATED"
        title="Transform any frame into a breathtaking Instagram Story."
        subtitle="Zero design skills or software required. Drop in your favorite photo frame, let our smart engine auto-detect the slots, and export in full 1080×1920 HD."
        buttonText="Upload Your Frame"
        buttonHref="/gallery"
      />
    </section>
  );
};

export default FinalCTASection;
