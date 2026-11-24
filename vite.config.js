import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import packageJson from "./package.json" with { type: "json" };

// GitHub Pages serves from /bowers-frontier-institute/
const base = process.env.GITHUB_PAGES === "true" ? "/bowers-frontier-institute/" : "/";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base,
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version),
  },
  plugins: [
    react(),
    {
      name: "copy-hypotheses-json",
      closeBundle() {
        const destDir = path.resolve(__dirname, "dist/research");
        mkdirSync(destDir, { recursive: true });
        copyFileSync(
          path.resolve(__dirname, "data/research/hypotheses.json"),
          path.join(destDir, "hypotheses.json"),
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        research: path.resolve(__dirname, "research.html"),
      },
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
