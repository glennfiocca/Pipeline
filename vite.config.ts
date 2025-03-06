import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Only use Replit plugins in the Replit environment
const plugins = [react()];
if (process.env.REPLIT) {
  try {
    const themePlugin = require("@replit/vite-plugin-shadcn-theme-json");
    const runtimeErrorOverlay = require("@replit/vite-plugin-runtime-error-modal");
    plugins.push(runtimeErrorOverlay.default(), themePlugin.default());
  } catch (e) {
    console.log("Replit plugins not available in local environment");
  }
}

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
