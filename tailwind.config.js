/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs", "./public/js/**/*.js"],
  safelist: [
    "bg-slate-100", "text-slate-600",
    "bg-blue-100", "text-blue-700",
    "bg-amber-100", "text-amber-700",
    "bg-leaf-500/15", "text-leaf-700",
    "bg-red-100", "text-red-700",
    "bg-brand-100", "text-brand-700"
  ],
  theme: {
    extend: {
      colors: {
        // brand + accent are driven by CSS custom properties (see
        // src/input.css) so the public site's palette can switch live
        // per [data-theme] without a rebuild — set from Cài đặt > Giao diện.
        brand: {
          50: "rgb(var(--c-brand-50) / <alpha-value>)",
          100: "rgb(var(--c-brand-100) / <alpha-value>)",
          200: "rgb(var(--c-brand-200) / <alpha-value>)",
          300: "rgb(var(--c-brand-300) / <alpha-value>)",
          400: "rgb(var(--c-brand-400) / <alpha-value>)",
          500: "rgb(var(--c-brand-500) / <alpha-value>)",
          600: "rgb(var(--c-brand-600) / <alpha-value>)",
          700: "rgb(var(--c-brand-700) / <alpha-value>)",
          800: "rgb(var(--c-brand-800) / <alpha-value>)",
          900: "rgb(var(--c-brand-900) / <alpha-value>)",
          950: "rgb(var(--c-brand-950) / <alpha-value>)"
        },
        accent: {
          50: "rgb(var(--c-accent-50) / <alpha-value>)",
          100: "rgb(var(--c-accent-100) / <alpha-value>)",
          600: "rgb(var(--c-accent-600) / <alpha-value>)",
          700: "rgb(var(--c-accent-700) / <alpha-value>)"
        },
        aqua: {
          400: "#5fd9dd",
          500: "#2cc3c9",
          600: "#1c9fa5"
        },
        leaf: {
          400: "#7fcf8f",
          500: "#4caf6d",
          600: "#39905a"
        },
        sand: {
          50: "#fbfaf7",
          100: "#f5f2eb"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(12, 41, 71, 0.18)",
        soft: "0 4px 20px -4px rgba(12, 41, 71, 0.12)"
      },
      backgroundImage: {
        "wave-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 120'%3E%3Cpath fill='%23ffffff' d='M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,80C1120,85,1280,75,1360,69.3L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z'/%3E%3C/svg%3E\")"
      }
    }
  },
  plugins: []
};
