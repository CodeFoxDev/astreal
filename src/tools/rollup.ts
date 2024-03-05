import type { Plugin } from "rollup";
import { join, normalize } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { prepareFolder, generateRoutes } from "declarations";
import { walkSync, resolveToRoute } from "utils";
import { normalizePath } from "@rollup/pluginutils";

export interface Options {
  /**
   * The base directory of the router, relative to the working directory
   * @default 'api'
   */
  routerDir?: string;

  // TODO: (currently always true)
  /**
   * Will provide globals to all files in the api directory, this has the advantage of providing more ts support,
   * like adding the full route to the req object and resolving route params in directory names,
   * if set to false, you will have to import the handlers yourself.
   * @default true
   */
  provideGlobals?: boolean;

  // TODO:
  /**
   * Will change the tsconfig file in the root of the project to include declarations for the api,
   * otherwise manually add `.astreal/routes.d.ts` to the `include` section in the tsconfig.json file
   * @default false
   */
  allowModifyingTSConfig?: boolean;

  // TODO:
  /**
   * Specifies wheter or not to generate the `.astreal` folder in the project root or in the node_modules folder,
   * by default it will be in the project's root.
   * @default true
   */
  projectLevelTypeFolder?: boolean;

  //bundleFiles: boolean;
}

export default function (_opts?: Options): Plugin {
  _opts ??= {};
  _opts.routerDir ??= "api";
  _opts.provideGlobals ??= true;
  const options = _opts as Required<Options>;

  const routerDir = normalizePath(join(process.cwd(), options.routerDir));
  const relRouterDir = normalizePath(options.routerDir);
  let files: { route: string; id: string }[] = [];

  return {
    name: "astreal",

    // Retrieve all the files that server api directory to generate map of import files (or bundle into one file)
    buildStart(_options) {
      if (!existsSync(routerDir)) return; // handle error

      const _files = walkSync(routerDir);
      files = [];

      for (const f of _files) {
        if (!f.endsWith(".ts") && !f.endsWith(".js")) continue;
        const route = f.replaceAll("\\", "/").replace(routerDir, "");
        // TODO: Provide option to merge all route files into single file
        const id = this.emitFile({
          type: "chunk",
          id: `${relRouterDir}${route}`
        });
        files.push({ id, route });
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
      const id = normalizePath(_id);
      if (!id.includes(routerDir)) return;
      const rel = id.replace(routerDir, "");
      const route = resolveToRoute(rel);
      // TODO: Create compiler(ish) to avoid errors if e.g. get has already been declared
      const pre = `import { router } from "astreal"; const { get, post } = router("${route}"); \n`;
      const res = pre + code;

      return res;
    }
  };
}
