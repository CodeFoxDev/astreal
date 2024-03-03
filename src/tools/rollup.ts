import type { Plugin } from "rollup";
import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { prepareFolder, generateRoutes } from "declarations";
import { walkSync } from "utils";
import { normalizePath } from "@rollup/pluginutils";

export interface Options {
  /**
   * The base directory of the router, relative to the working directory
   * @default 'api'
   */
  routerDir?: string;

  /**
   * Will provide globals to all files in the api directory, this has the advantage of providing more ts support,
   * like adding the full route to the req object and resolving route params in directory names,
   * if set to false, you will have to import the handlers yourself.
   * @default true
   */
  provideGlobals?: boolean;

  /**
   * Will change the tsconfig file in the root of the project to include declarations for the api,
   * otherwise manually add `.astreal/routes.d.ts` to the `include` section in the tsconfig.json file
   * @default false
   */
  allowModifyingTSConfig?: boolean;

  //bundleFiles: boolean;
}

export default function (_opts?: Options): Plugin {
  _opts ??= {};
  _opts.routerDir ??= "api";
  _opts.provideGlobals ??= true;
  const options = _opts as Required<Options>;

  let files: string[] = [];

  return {
    name: "astreal",

    // Retrieve all the files that server api directory to generate map of import files (or bundle into one file)
    buildStart(_options) {
      const routerDir = join(process.cwd(), options.routerDir);
      const normRouterDir = routerDir.replaceAll("\\", "/");
      if (!existsSync(routerDir)) return; // handle error

      const _files = walkSync(routerDir);
      files = [];

      for (const f of _files) {
        const route = f.replaceAll("\\", "/").replace(normRouterDir, "");
        files.push(route);

        // TODO: Provide option to merge all route files into single file
        this.emitFile({
          type: "chunk",
          id: `api${route}`
        });
      }
    },
    // Generate / update types on buildend, to avoid interference with rollup
    async buildEnd() {
      await prepareFolder();
      const routes = generateRoutes(files, options);
      await routes.write();
    },
    async transform(code, _id) {
      const id = normalizePath(_id);
      // TODO: transform file to include correct imports
    }
  };
}
