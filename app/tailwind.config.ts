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
        "bg-warm": "#F8F9FC",
        primary: {
          DEFAULT: "#4F46E5",
          light: "#6366F1",
          dark: "#3730A3",
        },
        secondary: "#64748B",
        accent: "#F97316",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        // Clinical structure colors (updated vibrant palette)
        clinical: {
          1: "#F97316", // Body
          2: "#F59E0B", // Immediate Experience
          3: "#EC4899", // Emotion
          4: "#8B5CF6", // Behaviour
          5: "#3B82F6", // Social
          6: "#6366F1", // Cognitive
          7: "#4F46E5", // Reflective (primary indigo)
          8: "#10B981", // Narrative (success green)
          9: "#A3A830", // Ecological
          10: "#9CA3AF", // Normative
        },
      },
      fontFamily: {
        playfair: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "Oxygen", "Ubuntu", "sans-serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "Oxygen", "Ubuntu", "sans-serif"],
        mono: ["'Monaco'", "'Cascadia Code'", "'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
