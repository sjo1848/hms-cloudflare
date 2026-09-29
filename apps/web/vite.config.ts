import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "apps/web",
  build: { outDir: "dist", emptyOutDir: true, minify: "terser", terserOptions: { ecma: 2022, compress: { passes: 4, pure_getters: true, arrows: true, booleans_as_integers: true, unsafe_arrows: true }, mangle: true, format: { comments: false } }, modulePreload: { polyfill: false } },
  server: { proxy: { "/api": "http://127.0.0.1:8787" } },
});
