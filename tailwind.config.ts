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
        // Rivervale brand palette
        rv: {
          bg:        "#0d0f14",
          surface:   "#13161e",
          border:    "#1e2433",
          muted:     "#2a3044",
          subtle:    "#8892a4",
          text:      "#e2e8f0",
          accent:    "#6366f1", // indigo
          "accent-hover": "#818cf8",
        },
        agent: {
          housekeeper: "#f59e0b",
          panda:       "#10b981",
          polarbear:   "#60a5fa",
          architect:   "#a78bfa",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
