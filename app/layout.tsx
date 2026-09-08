import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "TempTree — Aesthetic Instagram Story Templates & In-Browser Editor",
  description: "Browse curated aesthetic Instagram Story templates (Y2K, Minimal, Dreamy, Vintage, Bold) and customize them in a free in-browser editor.",
  keywords: ["Instagram Story templates", "aesthetic templates", "Y2K", "Minimal", "Dreamy", "Vintage", "Bold", "free story editor"],
  openGraph: {
    title: "TempTree — Aesthetic Instagram Story Templates",
    description: "Customize aesthetic Instagram Story templates for free and export ready-to-post 1080x1920 images.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-cream text-plum font-poppins selection:bg-mauve selection:text-cream antialiased">
        {children}
      </body>
    </html>
  );
}
