/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#111111",
        "surface-alt": "#0f0f0f",
        border: {
          DEFAULT: "#1f1f1f",
          hover: "#2f2f2f",
        },
        text: {
          primary: "#ffffff",
          secondary: "#888888",
          muted: "#555555",
        },
        profit: "#22c55e",
        loss: "#ef4444",
        accent: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
        },
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      fontSize: {
        h1: ["32px", { lineHeight: "1.25", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        small: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      borderRadius: {
        card: "12px",
        control: "8px",
      },
      maxWidth: {
        content: "1200px",
      },
      boxShadow: {
        card: "0 8px 24px -8px rgba(0, 0, 0, 0.5)",
        "card-hover": "0 12px 32px -8px rgba(0, 0, 0, 0.65)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(24px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-in-right": "slide-in-right 250ms ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
