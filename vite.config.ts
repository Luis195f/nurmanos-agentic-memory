import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

import { apiOriginFromBaseUrl } from "./src/shared/csp";

const API_CONNECT_SOURCE = "__H1_API_CONNECT_SOURCE__";

function apiCspPlugin(apiOrigin: string): Plugin {
  return {
    name: "nurmanos-api-csp",
    transformIndexHtml(html) {
      return html.replace(API_CONNECT_SOURCE, apiOrigin);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiOrigin = apiOriginFromBaseUrl(
    process.env.VITE_API_BASE_URL ?? env.VITE_API_BASE_URL,
  );

  return {
    plugins: [apiCspPlugin(apiOrigin), react()],
    build: { outDir: "dist/frontend", emptyOutDir: false },
    server: { port: 5173 },
  };
});
