import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        red: "#D52B1E",
        ink: "#1A1A1A",
        muted: "#6B7280",
        line: "#E4E4E7",
        cloud: "#F4F4F5",
        success: "#1E7A46",
        warn: "#B4740E",
        danger: "#A61B1B",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
