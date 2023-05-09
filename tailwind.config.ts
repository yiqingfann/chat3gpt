import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary": "#292c35",
        "accent": "#f4adc4"
      }
    },
  },
  plugins: [],
} satisfies Config;
