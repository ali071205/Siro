
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    // Dev-only: proxy to local Python backend
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8080",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    // Output preset for Vercel deployment
    preset: "vercel",
  },
});
