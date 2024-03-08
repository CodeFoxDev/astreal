import type { Plugin } from "rollup";
import type { Options } from "config";
import { join, normalize } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { prepareFolder, generateRoutes } from "declarations";
import { walkSync, resolveToRoute } from "utils";
import { resolveOptions } from "config";
import { Module } from "compiler";
import { normalizePath } from "@rollup/pluginutils";

export default function (_opts?: Options): Plugin {
  const options = resolveOptions(_opts);

  const routerDir = normalizePath(join(process.cwd(), options.apiDirectory));
  const relRouterDir = normalizePath(options.apiDirectory);

  const module = new Module(options);
  let files: { route: string; id: string }[] = [];

  // TODO: implement watchchange hooks to improve performance in watch mode
  return {
    name: "astreal",

    // Retrieve all the files that server api directory to generate map of import files (or bundle into one file)
    async buildStart(_options) {
      if (!existsSync(routerDir)) return; // handle error

      const _files = walkSync(routerDir);
      files = [];

      for (const _id of _files) {
        if (!_id.endsWith(".ts") && !_id.endsWith(".js")) continue;
        const id = normalizePath(_id);
        const content = await this.load({
          id,
          meta: {
            augmentGlobals: false // Set this to true if not bundling
          }
        });

        if (!content.code) continue;
        if (options.bundleFiles === true) module.link(id, content.code);
        else {
          const compiled = Module.compile(id, content.code, options);
          if (!compiled) continue;
          module.link(id, compiled.code);

          const route = id.replace(routerDir, "").replace(".ts", ".js");
          files.push({ route, id });
          this.emitFile({
            type: "prebuilt-chunk",
            fileName: `${relRouterDir}${route}`,
            code: compiled.code
          });
        }
      }

      const compiled = module.compile();
      if (compiled.type === "entry") {
        this.emitFile({
          type: "prebuilt-chunk",
          fileName: `${relRouterDir}/__routes.js`,
          code: compiled.code
        });
      }
    },
    // Generate / update types, to avoid interference with rollup
    async writeBundle() {
      await prepareFolder();
      const routes = generateRoutes(
        files.map((e) => e.route),
        options
      );
      await routes.write();
    }
  };
}
