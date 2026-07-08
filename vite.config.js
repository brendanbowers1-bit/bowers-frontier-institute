import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

// GitHub Pages serves from /bowers-frontier-institute/
const base = process.env.GITHUB_PAGES === "true" ? "/bowers-frontier-institute/" : "/";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
