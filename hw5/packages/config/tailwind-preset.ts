import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1D9BF0",
          foreground: "#ffffff",
        },
        x: {
          bg: "#000000",
          text: "#E7E9EA",
          textSecondary: "#71767B",
          border: "#2F3336",
          hover: "rgba(255, 255, 255, 0.1)",
          blue: "#1D9BF0",
        },
      },
      backgroundColor: {
        x: {
          DEFAULT: "#000000",
          hover: "rgba(255, 255, 255, 0.1)",
          card: "#16181C",
        },
      },
      textColor: {
        x: {
          DEFAULT: "#E7E9EA",
          secondary: "#71767B",
        },
      },
      borderColor: {
        "x-border": "#2F3336",
        x: {
          border: "#2F3336",
        },
      },
    },
  },
  plugins: [],
} satisfies Partial<Config>;


