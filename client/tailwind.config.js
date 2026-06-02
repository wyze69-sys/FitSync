/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0F1115",
        surface: "#181A20",
        text: "#F7F7F5",
        muted: "#9AA0A6",
        accent: "#C7FF41",
        border: "#2A2E37",
      },
      fontFamily: {
        sans: ['General Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
        md: "8px",
        lg: "8px",
        xl: "8px",
        "2xl": "8px",
        "3xl": "8px",
      },
    },
  },
  plugins: [],
};
