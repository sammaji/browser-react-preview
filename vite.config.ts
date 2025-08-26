import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
// import monacoEditorPlugin from "vite-plugin-monaco-editor";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    /*monacoEditorPlugin({
      languageWorkers: ["editorWorkerService", "typescript"],
    }),*/
  ],
  optimizeDeps: {
    include: ["monaco-editor"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
