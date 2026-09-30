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
        boutique: {
          bg: "#FAF0F2", // Pastel Rosado Suave / Nude Boutique
          card: "#FFFFFF",
          border: "#FCE7F3", // rose-100
          text: "#1F2937", // Carbón Suave
          muted: "#6B7280", // Gris neutro
          accent: "#F43F5E", // rose-500
          accentBg: "#FFF1F2", // rose-50
          whatsapp: "#4E9F76", // Verde Salvia / Menta Suave boutique
          whatsappHover: "#3D8361",
          whatsappLight: "#D1FAE5",
          whatsappDark: "#065F46",
        },
        brand: {
          dark: "#1F2937",
          gold: "#eab308",
          pink: "#ec4899",
          rose: "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
