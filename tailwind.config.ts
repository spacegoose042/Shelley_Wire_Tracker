import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        shelley: {
          blue: "#0033A0",
          "blue-light": "#0047BA",
          "blue-dark": "#002066",
          red: "#CC0000",
          "red-light": "#E30000",
          white: "#FFFFFF",
          gray: "#4A5568",
          "gray-light": "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
