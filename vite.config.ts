import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { assertBuildEnv } from "./build-env";

export default defineConfig(({ mode }) => {
  assertBuildEnv(mode, {
    ...process.env,
    ...loadEnv(mode, process.cwd(), "VITE_"),
  });
  return {
    plugins: [react()],
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      css: false,
    },
  };
});
