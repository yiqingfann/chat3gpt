import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary": "#292c35",
        "accent": {
          "100": "#f4adc4",
          "200": "#c44869"
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
