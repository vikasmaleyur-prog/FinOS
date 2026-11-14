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
        ramp: {
          lime: "#d9f154",
          "lime-dark": "#cbf037",
          "lime-hover": "#e2fd52",
          dark: "#0a0a0a",
          surface: "#0e1013",
          card: "#14161a",
          elevated: "#1b1d23",
          border: "rgba(255, 255, 255, 0.08)",
          "border-bright": "rgba(255, 255, 255, 0.16)",
          muted: "#8a8d9b",
          subtle: "#525562",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        "ramp-card": "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)",
        "ramp-glow": "0 0 20px -3px rgba(226, 253, 82, 0.25)",
        "ramp-elevated": "0 10px 30px -10px rgba(0, 0, 0, 0.8)",
      },
    },
  },
  plugins: [],
}
