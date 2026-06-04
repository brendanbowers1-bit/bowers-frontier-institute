import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves from /bowers-frontier-institute/
const base = process.env.GITHUB_PAGES === "true" ? "/bowers-frontier-institute/" : "/";

export default defineConfig({
  base,
  plugins: [react()],
});
