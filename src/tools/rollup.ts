import type { Plugin } from "rollup";
import type { Options } from "config";
import { join, normalize } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { prepareFolder, generateRoutes } from "declarations";
import { walkSync, resolveToRoute } from "utils";
import { resolveOptions } from "config";
import { ModuleCompiler } from "compiler";
import { normalizePath } from "@rollup/pluginutils";

export default function (_opts?: Options): Plugin {
  const options = resolveOptions(_opts);

  const routerDir = normalizePath(join(process.cwd(), options.apiDirectory));
  const relRouterDir = normalizePath(options.apiDirectory);

  const module = new ModuleCompiler(options);
  let files: { route: string; id: string }[] = [];

  return {
    name: "astreal",

    // Retrieve all the files that server api directory to generate map of import files (or bundle into one file)
    async buildStart(_options) {
      if (!existsSync(routerDir)) return; // handle error

      const _files = walkSync(routerDir);
      files = [];

      for (const f of _files) {
        if (!f.endsWith(".ts") && !f.endsWith(".js")) continue;
        const route = f.replaceAll("\\", "/").replace(routerDir, "");
        const content = await this.load({
          id: f,
          meta: {
            augmentGlobals: false // Set this to true if not bundling
          }
        });
        if (!content.code) continue; // Should never happen
        module.addTarget(f, content.code);
        // TODO: Provide option to merge all route files into single file
        /* const id = this.emitFile({
          type: "chunk",
          id: `${relRouterDir}${route}`
        });
        files.push({ id, route }); */
        //module.addTarget(route, content);
      }

      // Not sure if this works correctly in watch mode
      this.emitFile({
        type: "prebuilt-chunk",
        fileName: `${relRouterDir}/__routes.js`,
        code: `import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve, join } from "node:path";

export const files = ${JSON.stringify(files.map((e) => `${`.${e.route}`.slice(0, -2)}js`.replaceAll(/[\[\]]/g, "_")))};
export async function load() {
  const dir = resolve(fileURLToPath(import.meta.url), "../");
  for (const f of files) {
    const file = resolve(dir, f);
    await import(pathToFileURL(file).href);
  }
}`
      });
    },
    // Generate / update types, to avoid interference with rollup
    async writeBundle() {
      await prepareFolder();
      const routes = generateRoutes(
        files.map((e) => e.route),
        options
      );
      await routes.write();
    },
    async transform(code, _id) {
      const info = this.getModuleInfo(_id);
      const augmentGlobals = info?.meta?.augmentGlobals === true;
      if (augmentGlobals === false) return;

      const id = normalizePath(_id);
      if (!id.includes(routerDir)) return;
      const rel = id.replace(routerDir, "");
      const route = resolveToRoute(rel);
      // TODO: Create compiler(ish) to avoid errors if e.g. get has already been declared
      const pre = `import { router } from "astreal"; const { get, post } = router("${route}"); \n`;
      const res = pre + code;

      //parse(res);

      return res;
    }
  };
}
