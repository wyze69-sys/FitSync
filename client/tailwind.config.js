/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#EEEEEE",
        surface: "#FFFFFF",
        border: "#CBCBCB",
        text: "#2F332C",
        muted: "#777C6D",
        primary: "#777C6D",
        secondary: "#B7B89F",
        streak: "#EF4444",
        xp: "#22C55E",
      },
      fontFamily: {
        sans: ['General Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
        md: "8px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "28px",
      },
    },
  },
  plugins: [],
};
