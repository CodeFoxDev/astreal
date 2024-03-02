import { readFileSync } from "node:fs";
import { join, normalize } from "node:path";

/**
 * Prepares the content for file-writing
 */
export function s(content: any) {
  if (typeof content === "object") return JSON.stringify(content, null, "\t");
  else return content;
}

const root = join(import.meta.url.replace("file:///", ""), "../../../");

export const tsconfig = readFileSync(normalize(join(root, "./data/_tsconfig.json")), { encoding: "utf-8" });
export const helpers = readFileSync(normalize(join(root, "./data/_helpers.d.ts")), { encoding: "utf-8" });
