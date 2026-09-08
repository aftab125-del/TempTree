import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        plum: {
          DEFAULT: "var(--color-plum)",
          deep: "var(--color-plum)",
          light: "#78275c",
          dark: "#451233",
        },
        mauve: {
          DEFAULT: "var(--color-mauve)",
          light: "#c96c8d",
          dark: "#9e4363",
        },
        dustyPink: {
          DEFAULT: "var(--color-dusty-pink)",
          light: "#f0b3b3",
          dark: "#d68383",
        },
        cream: {
          DEFAULT: "var(--color-cream)",
          light: "#fff4d4",
          dark: "#ebd49e",
        },
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", "serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
