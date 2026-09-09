import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Scale, ShieldAlert, Sparkles, Copyright } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using TempTree, an independent in-browser story editor by Aftab Kathat.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
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
            Independent Studio · 桜の規約
          </span>
        </div>

        <h1 className="font-playfair text-4xl sm:text-5xl font-bold tracking-tight text-[#FAF7F2] mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-[#FAF7F2]/60 font-light tracking-wide mb-12">
          Effective Date: September 2026 &middot; Authored by Aftab Kathat
        </p>

        {/* Hero Callout Card */}
        <div className="relative rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent border border-white/15 backdrop-blur-xl mb-12 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E2B4BD]/15 border border-[#E2B4BD]/30 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6 text-[#F7D6D0]" />
            </div>
            <div>
              <h2 className="font-playfair text-xl font-semibold text-[#FAF7F2] mb-2">
                Fair, Transparent &amp; Independent
              </h2>
              <p className="text-sm text-[#FAF7F2]/80 leading-relaxed font-light">
                TempTree is an independent digital atelier built to give you free, uncompromising creative control over your story layouts without subscriptions, locked features, or data harvesting.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-10 text-sm sm:text-base text-[#FAF7F2]/80 font-light leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF7F2] font-semibold text-lg font-playfair">
              <FileText className="w-5 h-5 text-[#F7D6D0]" />
              <h3>1. Use of the Studio</h3>
            </div>
            <p>
              By accessing and using TempTree, you agree to these terms. TempTree is provided as a client-side digital creative tool for arranging, framing, and exporting story artwork for personal, editorial, or commercial use.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF7F2] font-semibold text-lg font-playfair">
              <Copyright className="w-5 h-5 text-[#F7D6D0]" />
              <h3>2. Intellectual Property &amp; Content Ownership</h3>
            </div>
            <p>
              <strong className="text-[#FAF7F2] font-medium">You retain 100% ownership</strong> of all photographs, illustrations, and exported media you process through TempTree. TempTree claims zero intellectual property rights or licenses over user-provided media. You are solely responsible for ensuring that you possess the necessary rights or permissions for any images you manipulate.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF7F2] font-semibold text-lg font-playfair">
              <ShieldAlert className="w-5 h-5 text-[#F7D6D0]" />
              <h3>3. Non-Affiliation with Instagram / Meta</h3>
            </div>
            <p>
              TempTree is an independent studio project designed to create 1080&times;1920 dimensioned graphics. It is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta Platforms, Inc., or any of their subsidiaries or affiliates. The name &ldquo;Instagram&rdquo; as well as related names, marks, emblems, and images are registered trademarks of their respective owners.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#FAF7F2] font-semibold text-lg font-playfair">
              <Scale className="w-5 h-5 text-[#F7D6D0]" />
              <h3>4. &ldquo;As-Is&rdquo; Disclaimer</h3>
            </div>
            <p>
              TempTree is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied. While we strive for absolute stability and pixel-perfect rendering across all browsers, we are not liable for any unintended browser data loss or rendering inconsistencies.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pt-6 border-t border-white/10">
            <h3 className="text-[#FAF7F2] font-semibold text-lg font-playfair">
              5. Modifications to Terms
            </h3>
            <p>
              We reserve the right to update these terms as new features are introduced. Continued use of the studio after changes constitutes acceptance of revised terms.
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
