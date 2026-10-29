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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 16px 40px 0 rgba(31, 38, 135, 0.12)',
        'glass-glow': '0 0 25px rgba(59, 130, 246, 0.18)',
      },
      backdropBlur: {
        'none': '0',
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '6px',
        'lg': '8px',
        'xl': '10px',
        '2xl': '12px',
        '3xl': '16px',
      }
    },
  },
  plugins: [],
};
export default config;
