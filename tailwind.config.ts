import type { Config } from "tailwindcss";

// ============================================================
// TEMA CENTRALITZAT — "Muntanya clara"
// Tots els colors de l'app es defineixen aqui. Per canviar
// l'aspecte general de l'app, nomes cal tocar aquest fitxer.
// ============================================================

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fons: "#FAF7F2", // crema clar, fons principal de l'app
        text: {
          principal: "#3A3A35", // gris fosc calid
          secundari: "#7A7A72",
        },
        pi: {
          DEFAULT: "#4A7C59", // verd principal — natura
          fosc: "#2F5238",
          clar: "#EAF1EC",
        },
        cel: {
          DEFAULT: "#5B8AA6", // blau secundari — cel, aigua
          fosc: "#0F4D66",
          clar: "#DDEAF1",
        },
        terra: {
          DEFAULT: "#C97D4A", // terracota — accent, botons d'accio
          fosc: "#7A3D1E",
          clar: "#F3E2D3",
        },
        exit: {
          DEFAULT: "#5A9367", // verd validacio (control passat)
          fosc: "#2F5238",
          clar: "#EAF1EC",
        },
        alerta: {
          DEFAULT: "#B5533C", // vermell terros — error, invalidat
          clar: "#F3DCD5",
        },
        vora: "#E5E1D8", // vores subtils de targetes
        superficie: "#FFFFFF", // fons de targetes sobre el fons crema
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
