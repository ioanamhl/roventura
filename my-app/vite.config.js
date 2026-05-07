import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/*// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  proxy: {
    "/forum": "http://localhost:3001",
    "/posts": "http://localhost:3001",
    "/uploads": "http://localhost:3001",
    "/login": "http://localhost:3001",
    "/signup": "http://localhost:3001",
  },
});
*/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
