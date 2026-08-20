import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

import { apiOriginFromBaseUrl } from "./src/shared/csp";

const API_CONNECT_SOURCE = "__H1_API_CONNECT_SOURCE__";

function apiCspPlugin(apiOrigin: string, mode: string): Plugin {
  return {
    name: "nurmanos-api-csp",
    transformIndexHtml(html) {
      const withApiOrigin = html.replace(API_CONNECT_SOURCE, apiOrigin);

      // Vite injects component CSS through an inline style element in development.
      // The production build remains on the strict, self-only policy from index.html.
      return mode === "development"
        ? withApiOrigin.replace(
            "style-src 'self'",
            "style-src 'self' 'unsafe-inline'",
          )
        : withApiOrigin;
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiOrigin = apiOriginFromBaseUrl(
    process.env.VITE_API_BASE_URL ?? env.VITE_API_BASE_URL,
  );

  return {
    plugins: [apiCspPlugin(apiOrigin, mode), react()],
    build: { outDir: "dist/frontend", emptyOutDir: true },
    server: { port: 5173 },
  };
});
