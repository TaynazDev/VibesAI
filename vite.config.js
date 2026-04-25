var _a, _b;
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
var isGhActions = ((_b = (_a = globalThis.process) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.GITHUB_ACTIONS) === "true";
export default defineConfig({
    base: isGhActions ? "/VibesAI/" : "/",
    plugins: [react()]
});
