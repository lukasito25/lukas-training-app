/** @type {import('tailwindcss').Config} */
// Tokens come from design/redesign/README.md. Keep this file and that table in sync.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chalk: "#F2F2EE",       // app background
        surface: "#FFFFFF",     // cards
        line: "#E4E4DE",        // card border
        ink: "#111113",         // text, primary buttons, selected states
        graphite: { DEFAULT: "#141518", 2: "#24252A" }, // hero cards / controls on dark
        volt: { DEFAULT: "#D4F55A", soft: "#E9F7B8", deep: "#2F4A07" }, // the single accent
        "volt-ink": { DEFAULT: "#3E6B12", mid: "#6F8F12", bar: "#9DBB2A" }, // accent on light
        muted: { DEFAULT: "#5C5C63", dark: "#A9A9B0", nav: "#6A6A71" },
        hairline: { DEFAULT: "#ECECE6", strong: "#D8D8D1", dot: "#C9C9C2" },
        "on-dark": "#F4F4F0",
        danger: { DEFAULT: "#A3311F", line: "#E8C4BD" },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: { tightish: "-0.02em", label: "0.08em" },
    },
  },
  plugins: [],
}
