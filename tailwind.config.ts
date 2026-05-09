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
        moo: {
          cream: "#f5f5f7",
          brown: "#6e6e73",
          dark: "#1d1d1f",
          accent: "#0071e3",
        },
      },
      fontFamily: {
        cute: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        apple: "0 2px 8px rgba(0,0,0,0.04)",
        "apple-lg": "0 4px 24px rgba(0,0,0,0.06)",
        "ios-icon": "0 2px 12px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        "ios-icon": "22%",
      },
    },
  },
  plugins: [],
};
export default config;
