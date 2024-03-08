// TODO: Parse api function (acorn) to rename all router functions (get, post, etc...) to unique names so it doesn't interfere with other functions
// TODO: Compile all the parsed api functions into a single function that adds correct context (the astreal app instance to the astreal global) and import all the used parts from astreal
import type { ResolvedOptions } from "config";
import { join } from "node:path";
import { resolveToRoute } from "utils";
import { normalizePath } from "@rollup/pluginutils";
import { parse as a_parse } from "acorn";

export async function parse(input: string) {
  const parsed = a_parse(input, { ecmaVersion: "latest", sourceType: "module" });
  console.log(input);
  console.log(JSON.stringify(parsed, null, 2));
  console.log("============================");

  parsed.body;
}

export class Module {
  options: ResolvedOptions;
  targets: {
    id: string;
    code: string;
  }[] = [];

  #router: string;

  constructor(options: ResolvedOptions) {
    this.options = options;
    this.#router = normalizePath(join(process.cwd(), options.apiDirectory));
  }

  /**
   * Adds a file to the compiled module
   * @param id The full path of the targetModule
   */
  link(id: string, code: string) {
    this.targets.push({ id, code });
  }

  /**
   * Compiles all the targets added via `link` into a single API function,
   * or generates the routes file if `bundleFiles` was set to false in the options
   */
  compile(): { type: "entry" | "module"; code: string } {
    if (this.options.bundleFiles === false) {
      return {
        type: "entry",
        code: `import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve, join } from "node:path";

export const files = ${JSON.stringify(
          this.targets.map((e) => `.${e.id.replace(this.#router, "")}`.replace(".ts", ".js"))
        )};
export async function load() {
  const dir = resolve(fileURLToPath(import.meta.url), "../");
  for (const f of files) await import(pathToFileURL(resolve(dir, f)).href);
}`
      };
    }
    return { type: "module", code: "" };
  }

  /**
   * Compiles a single file to add correct imports, but not merge them with others
   */
  static compile(id: string, code: string, options: ResolvedOptions): { code: string } | null {
    const routerDir = normalizePath(join(process.cwd(), options.apiDirectory));
    if (!id.startsWith(routerDir)) return null;
    // Add correct imports and paths
    const rel = id.replace(routerDir, "");
    const route = resolveToRoute(rel);

    const pre = `import { router } from "astreal";\nconst { get, post } = router("${route}");\n`;

    return { code: pre + code };
  }
}
