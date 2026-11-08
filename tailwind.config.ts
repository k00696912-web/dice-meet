import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F3F0E8",
        card: "#FFFFFF",
        foreground: "#292D2A",
        muted: "#6B716C",
        border: "#E2DDD0",
        primary: {
          DEFAULT: "#243B32",
          50: "#F0F4F2",
          100: "#D9E4DF",
          200: "#B3C9BF",
          300: "#8DAE9F",
          400: "#5C8270",
          500: "#3D6351",
          600: "#2F4D3F",
          700: "#243B32",
          800: "#1C2F27",
          900: "#14221C",
        },
        accent: {
          DEFAULT: "#B58B4C",
          50: "#FAF6EF",
          100: "#F2E8D5",
          200: "#E6D1AB",
          300: "#D9BA81",
          400: "#CCA357",
          500: "#B58B4C",
          600: "#9A7440",
          700: "#7E5E34",
          800: "#634A29",
          900: "#49361E",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        serif: [
          "ui-serif",
          "Georgia",
          "Noto Serif SC",
          "Songti SC",
          "SimSun",
          "serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(36, 59, 50, 0.06), 0 1px 2px rgba(36, 59, 50, 0.04)",
        "card-hover": "0 8px 24px rgba(36, 59, 50, 0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
