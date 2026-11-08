import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1240px" } },
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        sunk: "rgb(var(--sunk) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        mute: "rgb(var(--mute) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        brand: { DEFAULT: "rgb(var(--brand) / <alpha-value>)", deep: "rgb(var(--brand-deep) / <alpha-value>)", soft: "rgb(var(--brand-soft) / <alpha-value>)" },
        gold: { DEFAULT: "rgb(var(--gold) / <alpha-value>)", soft: "rgb(var(--gold-soft) / <alpha-value>)" },
        leaf: { DEFAULT: "rgb(var(--leaf) / <alpha-value>)", soft: "rgb(var(--leaf-soft) / <alpha-value>)" },
        bad: { DEFAULT: "rgb(var(--bad) / <alpha-value>)", soft: "rgb(var(--bad-soft) / <alpha-value>)" },
        info: { DEFAULT: "rgb(var(--info) / <alpha-value>)", soft: "rgb(var(--info-soft) / <alpha-value>)" },
        warn: { DEFAULT: "rgb(var(--warn) / <alpha-value>)", soft: "rgb(var(--warn-soft) / <alpha-value>)" },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Malayalam", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "Noto Serif Malayalam", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(20 46 55 / .05), 0 8px 24px -12px rgb(20 46 55 / .14)",
        pop: "0 20px 60px -20px rgb(20 46 55 / .45)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        spin360: { to: { transform: "rotate(360deg)" } },
      },
      animation: { "fade-up": "fade-up .45s ease both", spin360: "spin360 60s linear infinite" },
    },
  },
  plugins: [],
};
export default config;
