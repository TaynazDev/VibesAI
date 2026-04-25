import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isGhActions =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.GITHUB_ACTIONS === "true";

export default defineConfig({
  base: isGhActions ? "/VibesAI/" : "/",
  plugins: [react()]
});
