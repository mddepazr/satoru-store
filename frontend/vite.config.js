import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Envía las solicitudes de React al servidor Express.
      "/api": "http://127.0.0.1:3001",
    },
  },
});