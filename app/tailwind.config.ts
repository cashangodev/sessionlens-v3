import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-warm": "#FAFAF8",
        primary: {
          DEFAULT: "#2A5C5C",
          light: "#3D7A7A",
          dark: "#1D4343",
        },
        mint: {
          50: "#F0F7F4",
          100: "#D9EDE4",
          200: "#B8D9C8",
          300: "#8FC4A8",
          400: "#6B9E7D",
        },
        secondary: "#64748B",
        accent: "#F59E0B",
        success: "#6B9E7D",
        warning: "#F59E0B",
        error: "#EF4444",
        // Clinical structure colors (muted, sophisticated palette)
        clinical: {
          1: "#D97706", // Body (amber)
          2: "#E5A844", // Immediate Experience
          3: "#C06070", // Emotion (muted rose)
          4: "#7C6DB0", // Behaviour (muted purple)
          5: "#5284A5", // Social (slate blue)
          6: "#3D7A7A", // Cognitive (teal light)
          7: "#2A5C5C", // Reflective (primary teal)
          8: "#6B9E7D", // Narrative (sage green)
          9: "#8A9A3B", // Ecological (olive)
          10: "#8B95A2", // Normative (slate)
        },
      },
      fontFamily: {
        playfair: ["'Georgia'", "'Times New Roman'", "serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "Oxygen", "Ubuntu", "sans-serif"],
        mono: ["'Monaco'", "'Cascadia Code'", "'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
