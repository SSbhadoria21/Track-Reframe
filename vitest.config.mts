import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      skipFull: false,
      include: [
        "src/app/(main)/studio/script-formatter/page.tsx",
        "src/app/(main)/studio/script-formatter/pdf-export.ts",
        "src/lib/budget-defaults.ts",
      ],
    },
  },
});
