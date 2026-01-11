import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
      },
      colors: {
        // ✅ НОВАЯ ЦВЕТОВАЯ ПАЛИТРА (из Home page)
        border: "hsl(217, 33%, 17%)", // #1F2937 (gray-800)
        input: "hsl(217, 33%, 17%)",
        ring: "hsl(123, 48%, 72%)", // #93DA97 (new green accent)

        background: "hsl(217, 91%, 8%)", // #0A1628 (navy)
        foreground: "hsl(0, 0%, 100%)", // white

        primary: {
          DEFAULT: "hsl(123, 48%, 72%)", // #93DA97 (green)
          foreground: "hsl(217, 91%, 8%)", // black text on green
        },
        secondary: {
          DEFAULT: "hsl(217, 33%, 17%)", // #1F2937 (dark gray)
          foreground: "hsl(0, 0%, 100%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        muted: {
          DEFAULT: "hsl(217, 33%, 17%)", // #1F2937
          foreground: "hsl(215, 16%, 65%)", // #9CA3AF (gray-400)
        },
        accent: {
          DEFAULT: "hsl(123, 48%, 72%)", // #93DA97
          foreground: "hsl(217, 91%, 8%)",
        },
        popover: {
          DEFAULT: "hsl(217, 91%, 8%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        card: {
          DEFAULT: "hsl(217, 33%, 17%)", // #1F2937 (dark cards)
          foreground: "hsl(0, 0%, 100%)",
        },
      },
      borderRadius: {
        lg: "1rem", // 16px
        md: "0.75rem", // 12px
        sm: "0.5rem", // 8px
      },
      backgroundImage: {
        'gradient-card': 'linear-gradient(to bottom right, hsl(217, 91%, 8%), hsl(217, 33%, 17%))',
        'gradient-primary': 'linear-gradient(135deg, hsl(123, 48%, 72%), hsl(123, 48%, 62%))',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(20px)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "fade-in-delayed": "fade-in 0.6s ease-out 0.3s forwards",
        "slide-in-right": "slide-in-right 0.5s ease-out forwards",
        "slide-in-left": "slide-in-left 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;