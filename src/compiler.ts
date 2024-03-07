// TODO: Parse api function (acorn) to rename all router functions (get, post, etc...) to unique names so it doesn't interfere with other functions
// TODO: Compile all the parsed api functions into a single function that adds correct context (the astreal app instance to the astreal global) and import all the used parts from astreal
import type { ResolvedOptions } from "config";
import { parse as a_parse } from "acorn";

export async function parse(input: string) {
  const parsed = a_parse(input, { ecmaVersion: "latest", sourceType: "module" });
  console.log(input);
  console.log(JSON.stringify(parsed, null, 2));
  console.log("============================");

  parsed.body;
}

export class ModuleCompiler {
  options: ResolvedOptions;
  targets: {
    path: string;
    content: string;
  }[] = [];

  constructor(options: ResolvedOptions) {
    this.options = options;
  }

  /**
   * Adds a file to the compiled module
   * @param path The full path of the targetModule
   */
  addTarget(path: string, content: string) {
    this.targets.push({ path, content });
  }

  /**
   * Compiles all the targets added via `addTarget` into a single API function
   */
  compile() {}
}
