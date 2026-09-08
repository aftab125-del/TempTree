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
        // Charcoal (was plum)
        plum: {
          DEFAULT: "var(--color-plum)",
          deep: "var(--color-plum)",
          light: "#636363",
          dark: "#2B2B2B",
        },
        charcoal: {
          DEFAULT: "#4A4A4A",
          light: "#636363",
          dark: "#2B2B2B",
        },
        // Dusty Mauve (was mauve)
        mauve: {
          DEFAULT: "var(--color-mauve)",
          light: "#EDC9D0",
          dark: "#CFA0AA",
        },
        dustyMauve: {
          DEFAULT: "#E2B4BD",
          light: "#EDC9D0",
          dark: "#CFA0AA",
        },
        // Peach Pink (was dusty pink)
        dustyPink: {
          DEFAULT: "var(--color-dusty-pink)",
          light: "#FCEAE7",
          dark: "#E5C2BC",
        },
        peachPink: {
          DEFAULT: "#F7D6D0",
          light: "#FCEAE7",
          dark: "#E5C2BC",
        },
        // Blush White (was cream)
        cream: {
          DEFAULT: "var(--color-cream)",
          light: "#FFFFFF",
          dark: "#F5EBEB",
        },
        blushWhite: {
          DEFAULT: "#FFF5F5",
          light: "#FFFFFF",
          dark: "#F5EBEB",
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
