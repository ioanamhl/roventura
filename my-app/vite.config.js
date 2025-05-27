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
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
