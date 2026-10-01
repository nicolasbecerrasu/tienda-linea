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
        atelier: {
          blush: "#FBF1F3",
          blushLight: "#FFF8F8",
          blushDeep: "#F5E4E8",
          rose: "#E84364",
          roseLight: "#FDE8ED",
          roseHover: "#D63353",
          onyx: "#1F2937",
          onyxDark: "#0F172A",
          gold: "#D4AF37",
          goldLight: "#FBF5E5",
          sand: "#F7F5F0",
          border: "rgba(31, 41, 55, 0.08)",
        },
        boutique: {
          bg: "#FBF1F3",
          card: "#FFFFFF",
          border: "#F3D8DF",
          text: "#1F2937",
          muted: "#6B7280",
          accent: "#E84364",
          accentBg: "#FFF1F2",
          whatsapp: "#25D366",
          whatsappDark: "#1EBE5D",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        atelier: "0 10px 30px -10px rgba(232, 67, 100, 0.08)",
        card: "0 2px 12px 0 rgba(0, 0, 0, 0.04)",
        elevated: "0 20px 40px -15px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
