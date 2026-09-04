import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#e7e7e9",
          dim: "#9a9aa2",
          faint: "#6a6a72",
        },
        base: {
          DEFAULT: "#0a0a0b",
          raised: "#101012",
          border: "#1e1e22",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "48rem",
      },
    },
  },
  plugins: [],
};

export default config;
