import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        atlas: {
          bg: "#080b12",
          panel: "#101621",
          panelStrong: "#151d2b",
          border: "#263245",
          text: "#e6edf7",
          muted: "#92a2b8",
          cyan: "#40c8e8",
          green: "#5bd18a",
          amber: "#f5bc52",
          red: "#ef6a6a",
          violet: "#9d8cff",
        },
      },
      boxShadow: {
        atlas: "0 18px 80px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
