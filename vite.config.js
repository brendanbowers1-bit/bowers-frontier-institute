import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves from /bowers-frontier-institute/
const base = process.env.GITHUB_PAGES === "true" ? "/bowers-frontier-institute/" : "/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts")) return "charts";
          if (
            id.includes("node_modules/motion") ||
            id.includes("node_modules/framer-motion")
          ) {
            return "motion";
          }
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/lucide-react")
          ) {
            return "vendor";
          }
        },
      },
    },
  },
});
