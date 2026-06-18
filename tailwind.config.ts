import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Resume document text — stays dark so the PDF is readable
        ink: "#0F172A",
        // Landing-page light-ui primaries — electric violet
        primary: {
          DEFAULT: "#8B5CF6",
          dark: "#7C3AED",
          light: "#A78BFA",
          soft: "rgba(139,92,246,0.15)",
        },
        accent: {
          DEFAULT: "#06B6D4",   // cyan
          dark: "#0891B2",
          soft: "rgba(6,182,212,0.12)",
        },
        // Light-theme surface tokens (used in resume preview area)
        paper: "#FFFFFF",
        surface: "#070B14",
        muted: "#070B14",
        line: "#1A2B4A",
        border: "#1A2B4A",
        // ── Aurora Dark app-shell palette ──────────────────────────────
        nav: {
          bg: "#070B14",      // deep space
          panel: "#0D1426",   // dark surface
          card: "#132040",    // card / hover
          border: "#1A2B4A",  // subtle divider
          text: "#E2ECFF",    // near-white
          muted: "#6B7EAA",   // blue-gray
          blue: "#06B6D4",    // cyan  — gradient start
          indigo: "#8B5CF6",  // violet — gradient end
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Lora", "Georgia", "Cambria", "serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        // Dark-glass card with subtle violet rim
        card: "0 0 0 1px rgba(139,92,246,0.08), 0 4px 20px rgba(7,11,20,0.5)",
        sheet: "0 0 0 1px rgba(15,23,42,0.06), 0 20px 60px rgba(7,11,20,0.8)",
        "elevation-1": "0 2px 8px rgba(7,11,20,0.5), 0 0 0 1px rgba(139,92,246,0.06)",
        "elevation-2": "0 4px 16px rgba(7,11,20,0.6), 0 0 0 1px rgba(139,92,246,0.1)",
        "elevation-3": "0 8px 32px rgba(7,11,20,0.7), 0 0 0 1px rgba(139,92,246,0.15)",
        // Glow utilities
        "glow-primary": "0 0 20px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.2), 0 0 0 1px rgba(139,92,246,0.3)",
        "glow-cyan": "0 0 20px rgba(6,182,212,0.4), 0 0 40px rgba(6,182,212,0.15), 0 0 0 1px rgba(6,182,212,0.2)",
        "glow-sm": "0 0 12px rgba(139,92,246,0.35), 0 0 0 1px rgba(139,92,246,0.2)",
      },
      backgroundImage: {
        "aurora": "radial-gradient(ellipse 80% 50% at 20% 0%, rgba(139,92,246,0.3) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(6,182,212,0.2) 0%, transparent 60%)",
        "gradient-cta": "linear-gradient(135deg, #4C1D95 0%, #1E3A5F 50%, #0D1426 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
