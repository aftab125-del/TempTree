import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import AgentationProvider from "@/components/AgentationProvider";
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
  metadataBase: new URL("https://temptree.art"),
  title: {
    default: "TempTree — Bespoke Instagram Story Editor by Aftab Kathat",
    template: "%s | TempTree",
  },
  description:
    "A bespoke, privacy-first Instagram Story editor made by Aftab Kathat. Instant photo slot detection, 100% in-browser processing, and lossless 1080×1920 exports without paywalls or tracking.",
  keywords: [
    "Instagram Story editor",
    "story template editor",
    "Aftab Kathat",
    "aesthetic story templates",
    "client-side photo editor",
    "polaroid collage maker",
    "lossless 1080x1920",
    "privacy-first design tool",
  ],
  authors: [{ name: "Aftab Kathat" }],
  creator: "Aftab Kathat",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TempTree — Bespoke Instagram Story Editor by Aftab Kathat",
    description:
      "A bespoke story editor running 100% in your browser. Turn any frame into your story with instant cutout detection and lossless 1080×1920 exports.",
    url: "https://temptree.art",
    siteName: "TempTree",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TempTree — Bespoke Instagram Story Editor by Aftab Kathat",
    description:
      "A bespoke story editor running 100% in your browser. Instant cutout detection, private by design, lossless 1080×1920 exports.",
    creator: "@aftabkathat",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        <AgentationProvider />
      </body>
    </html>
  );
}
