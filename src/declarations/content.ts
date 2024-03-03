import { readFileSync } from "node:fs";
import { join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Prepares the content for file-writing
 */
export function s(content: any) {
  if (typeof content === "object") return JSON.stringify(content, null, "\t");
  else return content;
}

const root = join(fileURLToPath(import.meta.url), "../../../");

export const tsconfig = readFileSync(join(root, "./data/_tsconfig.json"), { encoding: "utf-8" });
export const helpers = readFileSync(join(root, "./data/_helpers.d.ts"), { encoding: "utf-8" });
