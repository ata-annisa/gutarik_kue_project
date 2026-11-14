import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: { usePolling: true },
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://backend:4000",
        changeOrigin: true,
        xfwd: true, // pass the real client IP so rate limiting and audit logs see it
      },
    },
  },
});
