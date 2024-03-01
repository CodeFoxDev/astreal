import type { Plugin } from "rollup";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { walkSync, generateDeclarations } from "utils";

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

  //bundleFiles: boolean;
}

export default function (_opts?: Options): Plugin {
  const options = _opts ?? {};
  options.routerDir ??= "api";
  options.provideGlobals ??= true;

  let files = [];

  return {
    name: "astreal",

    // Retrieve all the files that server api directory to generate map of import files (or bundle into one file)
    buildStart(_options) {
      options.routerDir ??= "api";
      const routerDir = join(process.cwd(), options.routerDir);
      const normRouterDir = routerDir.replaceAll("\\", "/");
      if (!existsSync(routerDir)) return; // handle error

      const _files = walkSync(routerDir);
      files = [];

      for (const f of _files) {
        const norm = f.replaceAll("\\", "/");
        files.push(norm.replace(normRouterDir, ""));
      }

      // Declarations
      const content = generateDeclarations(files, options);
      content.write();
    },
    // Generate / update types on buildend, to avoid interference with rollup
    buildEnd() {}
  };
}
