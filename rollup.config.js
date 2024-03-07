import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";

export default defineConfig([
  {
    input: ["src/index.ts", "src/tools/rollup.ts"],
    external: ["node:fs", "node:fs/promises", "node:url", "node:path", "@rollup/pluginutils", "acorn"],
    output: {
      dir: "dist",
      format: "es",
      exports: "named",
      preserveModules: true,
      preserveModulesRoot: "src"
    },
    plugins: [
      typescript(),
      commonjs({
        include: ["node_modules/**"]
      }),
      json()
    ]
  }
]);
