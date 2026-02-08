/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#1e293b",
          light: "#334155",
          dark: "#0f172a",
        },
        primary: {
          DEFAULT: "#38bdf8",
          dark: "#0ea5e9",
        },
        accent: {
          green: "#34d399",
          red: "#f87171",
        },
      },
    },
  },
  plugins: [],
};
