import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        ink: {
          950: "#09090b",
          900: "#0c0c0f",
          850: "#101014",
          800: "#16161c",
          700: "#1d1d25",
        },
        brand: {
          50: "#eef2ff",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          violet: "#8b5cf6",
          fuchsia: "#d946ef",
        },
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "28px",
      },
      boxShadow: {
        soft: "0 1px 0 rgba(255,255,255,.04) inset, 0 24px 60px -24px rgba(0,0,0,.7)",
        glow: "0 0 0 1px rgba(99,102,241,.25), 0 18px 60px -18px rgba(99,102,241,.5)",
        card: "0 20px 60px -24px rgba(0,0,0,.75)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        auroramove: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(4%,3%) scale(1.08)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        aurora: "auroramove 18s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
