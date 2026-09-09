import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Sparkles, Cpu, HardDrive } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "TempTree's commitment to zero server uploads, 100% client-side photo processing, and zero tracking cookies.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#140e13] text-[#FAF7F2] font-poppins selection:bg-[#E2B4BD] selection:text-[#181116] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Top Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#E2B4BD] hover:text-[#FAF7F2] transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Studio</span>
        </Link>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-[#E2B4BD]/30 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#F7D6D0]" />
          <span className="text-xs uppercase tracking-[0.25em] text-[#F7D6D0] font-medium">
            Independent Studio · 桜の約束
          </span>
        </div>

        <h1 className="font-playfair text-4xl sm:text-5xl font-bold tracking-tight text-[#FAF7F2] mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#FAF7F2]/60 font-light tracking-wide mb-12">
          Effective Date: September 2026 &middot; Crafted by Aftab Kathat
        </p>

        {/* Hero Callout Card */}
        <div className="relative rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent border border-white/15 backdrop-blur-xl mb-12 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E2B4BD]/15 border border-[#E2B4BD]/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#F7D6D0]" />
            </div>
            <div>
              <h2 className="font-playfair text-xl font-semibold text-[#FAF7F2] mb-2">
                Our Core Promise: Private by Architecture
              </h2>
              <p className="text-sm text-[#FAF7F2]/80 leading-relaxed font-light">
                TempTree was built from day one on a radical principle: your personal memories belong to you, not to our servers. All cutout calculations, cropping, and photo rendering run 100% inside your device&apos;s browser.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-10 text-sm sm:text-base text-[#FAF7F2]/80 font-light leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF7F2] font-semibold text-lg font-playfair">
              <EyeOff className="w-5 h-5 text-[#F7D6D0]" />
              <h3>1. Zero Server Uploads of Personal Photos</h3>
            </div>
            <p>
              When you drop photos, polaroids, or custom frames into the TempTree canvas, they are decoded and processed exclusively in your browser using the HTML5 Canvas and WebGL APIs. At no point are your photographs transmitted over the internet or saved to any cloud storage bucket, database, or remote server.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF7F2] font-semibold text-lg font-playfair">
              <Lock className="w-5 h-5 text-[#F7D6D0]" />
              <h3>2. No Tracking Cookies or Ad Pixels</h3>
            </div>
            <p>
              We do not track your digital footprint. TempTree does not include Google Analytics, Facebook Pixel, advertising beacons, or third-party marketing SDKs. Because we do not use non-essential tracking cookies, there is no annoying cookie banner interrupting your creative flow.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF7F2] font-semibold text-lg font-playfair">
              <HardDrive className="w-5 h-5 text-[#F7D6D0]" />
              <h3>3. Local Browser Storage</h3>
            </div>
            <p>
              Any template history or editor preferences (such as canvas zoom or recent aspect ratios) are stored solely within your device&apos;s local browser storage (<code className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-[#F7D6D0]">localStorage</code>). You retain complete control and can erase this data at any time by clearing your browser cache.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF7F2] font-semibold text-lg font-playfair">
              <Cpu className="w-5 h-5 text-[#F7D6D0]" />
              <h3>4. Lossless Export Engine</h3>
            </div>
            <p>
              When you click &ldquo;Export 1080&times;1920&rdquo;, the uncompressed high-resolution PNG is rasterized directly on your computer&apos;s GPU and dispatched as an immediate browser download. No third-party rendering APIs are invoked.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pt-6 border-t border-white/10">
            <h3 className="text-[#FAF7F2] font-semibold text-lg font-playfair">
              5. Contact &amp; Inquiries
            </h3>
            <p>
              If you have any questions or feedback regarding our architecture or privacy practices, feel free to reach out directly to Aftab Kathat through our project repository or studio channels.
            </p>
          </section>
        </div>

        {/* Bottom Back Button */}
        <div className="mt-16 pt-8 border-t border-white/10 flex justify-between items-center text-xs text-[#FAF7F2]/50">
          <span>&copy; {new Date().getFullYear()} TempTree &middot; Aftab Kathat</span>
          <Link href="/" className="text-[#E2B4BD] hover:underline">
            Return to Studio &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
