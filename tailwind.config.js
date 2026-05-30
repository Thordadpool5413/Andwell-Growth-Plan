/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2563eb",
          green: "#16a34a",
          purple: "#7c3aed",
          red: "#dc2626",
          amber: "#f59e0b",
          slate: "#64748b",
        }
      }
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
