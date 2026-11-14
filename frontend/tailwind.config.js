/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#7650A8",
          hover: "#643F96",
          pressed: "#523082",
          tint: "#F3EDFA",
          "tint-subtle": "#EBE2F7",
          border: "#EAE6F0",
        },
        surface: {
          page: "#F7F5FA",
          sidebar: "#FFFFFF",
          main: "#F7F5FA",
          card: "#FFFFFF",
          border: "#EAE6F0",
          muted: "#F3EDFA",
        },
        typography: {
          heading: "#17152D",
          body: "#17152D",
          secondary: "#77758A",
          muted: "#77758A",
          subtle: "#9896A9",
        },
        semantic: {
          success: "#159B72",
          "success-bg": "#E8F8F2",
          "success-text": "#0E684C",
          "success-border": "#B4E8D6",
          warning: "#F5A623",
          "warning-bg": "#FEF7EC",
          "warning-text": "#8F5805",
          "warning-border": "#FBD9A3",
          critical: "#E64B55",
          "critical-bg": "#FDF1F2",
          "critical-text": "#9B1C23",
          "critical-border": "#F9B8BC",
        },
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(118, 80, 168, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 8px 30px -4px rgba(118, 80, 168, 0.09), 0 4px 12px -2px rgba(0, 0, 0, 0.05)",
        dropdown: "0 10px 25px -5px rgba(118, 80, 168, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
}
