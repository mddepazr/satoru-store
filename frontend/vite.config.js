import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Habilita React y la actualización de componentes durante el desarrollo.
  plugins: [react()],
  server: {
    port: 5173,
    // Si el puerto está ocupado, avisa en lugar de cambiarlo silenciosamente.
    strictPort: true,
    // Este proxy funciona en desarrollo; producción necesita su propia configuración.
    proxy: {
      // Envía las solicitudes de React al servidor Express.
      "/api": "http://127.0.0.1:3001",
    },
  },
});