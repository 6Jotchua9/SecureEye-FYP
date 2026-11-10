import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const apiProxy = process.env.API_PROXY || "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(rootDir, "node_modules/react"),
      "react-dom": path.resolve(rootDir, "node_modules/react-dom"),
      "react-router-dom": path.resolve(rootDir, "node_modules/react-router-dom"),
    },
  },
  server: {
    fs: {
      allow: [rootDir, path.resolve(rootDir, "../design-system")],
    },
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/auth": apiProxy,
      "/portal": apiProxy,
      "/health": apiProxy,
    },
  },
});
