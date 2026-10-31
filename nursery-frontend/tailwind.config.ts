import type { Config } from "tailwindcss";

// Greenhouse palette: deep canopy greens, soft leaf tints, bark brown for warmth.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canopy: "#1F4D3A", // navbar, headings
        fern: "#2F6B4F",   // primary buttons, links
        leaf: "#5FA36B",   // focus rings, accents
        sage: "#D5E5D6",   // borders
        dew: "#E6F0E3",    // soft fills
        mist: "#F1F6EF",   // page background
        ink: "#1B2A21",    // body text
        stone: "#566659",  // secondary text
        bark: "#6B5B45",
        amber: "#8A5508",  // warnings (text)
        rust: "#A83B2A",   // errors / overdue (text)
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
