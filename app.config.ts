import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  tsr: {
    generatedRouteTree: "./src/routeTree.gen.ts",
    routesDirectory: "./src/routes",
    autoCodeSplitting: true,
  },
  server: {
    preset: "node-server",
  },
  vite: {
    plugins: [tsConfigPaths(), tailwindcss()],
  },
});
