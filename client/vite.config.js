import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      "/api": process.env.VITE_API_PROXY_TARGET || "http://localhost:5001"
    }
  },
  preview: {
    port: 4174,
    proxy: {
      "/api": process.env.VITE_API_PROXY_TARGET || "http://localhost:5001"
    }
  }
});
