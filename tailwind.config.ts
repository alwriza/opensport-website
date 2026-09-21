import type { Config } from "tailwindcss";

/** Every color resolves from a CSS variable in index.css, so the palette has
 *  exactly one source of truth and opacity modifiers (`bg-primary/10`) work. */
const hsl = (v: string) => `hsl(var(${v}) / <alpha-value>)`;

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
      padding: { DEFAULT: "1.25rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },

      colors: {
        background: hsl("--background"),
        foreground: hsl("--foreground"),

        /* Elevation ladder — depth comes from these, never from hue */
        surface: {
          1: hsl("--surface-1"),
          2: hsl("--surface-2"),
          3: hsl("--surface-3"),
        },

        border: {
          DEFAULT: hsl("--border"),
          strong: hsl("--border-strong"),
        },
        input: hsl("--input"),
        ring: hsl("--ring"),

        primary: {
          DEFAULT: hsl("--primary"),
          hover: hsl("--primary-hover"),
          glow: hsl("--primary-glow"),
          foreground: hsl("--primary-foreground"),
        },
        secondary: {
          DEFAULT: hsl("--secondary"),
          foreground: hsl("--secondary-foreground"),
        },
        muted: {
          DEFAULT: hsl("--muted"),
          foreground: hsl("--muted-foreground"),
        },
        subtle: {
          foreground: hsl("--subtle-foreground"),
        },
        accent: {
          DEFAULT: hsl("--accent"),
          foreground: hsl("--accent-foreground"),
        },
        card: {
          DEFAULT: hsl("--card"),
          foreground: hsl("--card-foreground"),
        },
        popover: {
          DEFAULT: hsl("--popover"),
          foreground: hsl("--popover-foreground"),
        },

        success: hsl("--success"),
        warning: hsl("--warning"),
        destructive: {
          DEFAULT: hsl("--destructive"),
          foreground: hsl("--destructive-foreground"),
        },

        chart: {
          1: hsl("--chart-1"),
          2: hsl("--chart-2"),
          3: hsl("--chart-3"),
          4: hsl("--chart-4"),
          5: hsl("--chart-5"),
          6: hsl("--chart-6"),
        },
      },

      borderRadius: {
        sm: "0.5rem",
        md: "0.75rem",
        lg: "var(--radius)",
        xl: "1.125rem",
        "2xl": "1.375rem",
        "3xl": "1.75rem",
      },

      boxShadow: {
        card: "var(--shadow-card)",
        lifted: "var(--shadow-lifted)",
        glow: "var(--shadow-glow)",
      },

      /* Hero / display sizes with the tight leading the brand type wants */
      fontSize: {
        "display-sm": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-md": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "display-lg": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.035em" }],
        "display-xl": ["6rem", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
      },

      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, hsl(var(--primary-glow)), hsl(var(--primary)) 55%, hsl(var(--primary-hover)))",
        "gradient-card": "linear-gradient(160deg, hsl(var(--surface-2)), hsl(var(--surface-1)))",
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
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "none" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "none" },
          to: { opacity: "0", transform: "translateY(16px)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "none" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "none" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s cubic-bezier(0.22,1,0.36,1) forwards",
        "fade-in-delayed": "fade-in 0.6s cubic-bezier(0.22,1,0.36,1) 0.25s forwards",
        "slide-in-right": "slide-in-right 0.45s cubic-bezier(0.22,1,0.36,1) forwards",
        "slide-in-left": "slide-in-left 0.45s cubic-bezier(0.22,1,0.36,1) forwards",
        "scale-in": "scale-in 0.25s cubic-bezier(0.22,1,0.36,1) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
