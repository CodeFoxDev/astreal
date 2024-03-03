import type { Options } from "tools/rollup";
import { existsSync as exists, mkdirSync as mkdir, readFileSync, unlinkSync as unlink } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { joinRoot, resolveToRoute } from "utils";
import { tsconfig, helpers, s } from "./content";

const folder = joinRoot(".astreal");

/**
 * Prepares the `.astreal` folder in the root of the project
 */
export async function prepareFolder(overwrite: boolean = false) {
  if (overwrite === true) unlink(folder);
  if (!exists(folder)) mkdir(folder);

  if (!exists(join(folder, "tsconfig.json"))) await writeFile(join(folder, "tsconfig.json"), s(tsconfig));
  if (!exists(join(folder, "helpers.d.ts"))) await writeFile(join(folder, "helpers.d.ts"), s(helpers));
  if (!exists(join(folder, "routes.d.ts"))) await writeFile(join(folder, "routes.d.ts"), "");
}

/**
 * Updates the tsconfig in the root of the project to include definitions
 */
export async function updateTSConfig() {}

/**
 * Generate route declarations for the `routes.d.ts` file
 * @param files Array of files to include, relative to the routerDirectory
 */
export function generateRoutes(files: string[], options: Required<Options>) {
  let res = `import type { FormatReturn, Format } from "./helpers.d.ts";
import type { Listener, BaseRoute } from "astreal";
`;
  for (const f of files) res += generateModule(f, options);

  return {
    content: res,
    async write() {
      await writeFile(join(folder, "routes.d.ts"), res);
    }
  };
}

function generateModule(file: string, options: Required<Options>) {
  const route = resolveToRoute(file);
  return `
declare module "../${options.routerDir ?? "api"}${file}" {
  function get(callback: Listener<\`${route}\`, 'get'>): FormatReturn<\`${route}\`>;
  function get<P extends BaseRoute>(path: P, callback: Listener<\`${route}\${P}\`, 'get'>): FormatReturn<\`${route}\${P}\`>;
}
  `;
}
