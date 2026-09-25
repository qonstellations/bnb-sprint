/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0e14",
          900: "#10151d",
          850: "#141b25",
          800: "#1b2330",
          700: "#283244",
        },
        accent: {
          DEFAULT: "#818cf8",
          soft: "#a5b4fc",
          dim: "#4f46e5",
        },
      },
      fontFamily: {
        display: ["Sora", "DM Sans", "system-ui", "sans-serif"],
        sans: ["DM Sans", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px -12px rgb(0 0 0 / 0.5)",
        glow: "0 0 24px -6px rgb(129 140 248 / 0.45)",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "price-flash-up": {
          "0%": { color: "#6ee7b7" },
          "100%": { color: "inherit" },
        },
        "price-flash-down": {
          "0%": { color: "#fda4af" },
          "100%": { color: "inherit" },
        },
      },
      animation: {
        ticker: "ticker 32s linear infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
