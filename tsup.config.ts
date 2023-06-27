import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/bot.ts",
    "src/env.ts",
    "src/lib/*.ts",
    "src/utils/*.ts",
    "src/config/*.ts",
    "src/handler/*.ts",
    "src/controller/*.ts",
  ],
  splitting: true,
  sourcemap: true,
  clean: true,
});
