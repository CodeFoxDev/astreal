import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";

export default defineConfig([
  {
    input: ["src/index.ts", "src/plugin.ts"],
    external: ["node:fs", "node:path"],
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
      })
    ]
  }
]);
