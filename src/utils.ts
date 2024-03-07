import type { Options, ResolvedOptions } from "config";
import fs from "node:fs";
import path from "node:path";

export function* walkSync(dir: string): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}

/**
 * Turns the filename in the router directory into a valid route
 */
export function resolveToRoute(path: string) {
  if (path.endsWith(".ts") || path.endsWith(".js")) path = path.slice(0, -3);
  if (path.endsWith("/index")) path = path.replace("/index", "");

  if (path === "") return "/";
  else return path;
}

function ensureDirRel(dir: string, content?: string) {
  const f = path.join(process.cwd(), dir);
  if (!fs.existsSync(f)) fs.writeFileSync(f, content ?? "", { encoding: "utf-8" });
}

export function joinRoot(...files: string[]) {
  return path.join(process.cwd(), ...files);
}

// Declarations
// TODO: Add removeTrailing and compact this maybe
const baseContent = `
export {};
type BaseRoute = \`/\${string}\`;
type EnsureSlash<P extends string> = P extends \`/\${string}\` ? P : \`/\${P}\`;
type StripType<Path extends string, Next extends string> = Path extends \`[\${infer Param}]\`
  ? Path extends \`[\${infer ParamWOT} :\${string}]\`
    ? \`[\${ParamWOT}]\${Next}\`
    : Path extends \`[\${infer ParamWOT}:\${string}]\`
    ? \`[\${ParamWOT}]\${Next}\`
    : \`[\${Param}]\${Next}\`
  : \`\${Path}\${Next}\`;
type StripTypes<Path extends string> = Path extends \`\${infer Segment}/\${infer Rest}\`
  ? StripType<Segment, \`/\${StripTypes<Rest>}\`>
  : StripType<Path, "">;
type RemoveDoubleSlashes<Path extends string> = Path extends \`\${infer Segment}//\${infer Rest}\`
  ? RemoveDoubleSlashes<\`\${Segment}/\${RemoveDoubleSlashes<Rest>}\`>
  : Path;
`;

export function generateDeclarations(files: string[], options: ResolvedOptions) {
  let res = baseContent;

  for (const f of files) res += generateModuleCode(f, options);
  return {
    content: res,
    write() {
      ensureDirRel(".astreal");
      fs.writeFileSync(path.join(process.cwd(), ".astreal/routes.d.ts"), res);
    }
  };
}

function generateModuleCode(file: string, options: ResolvedOptions) {
  const route = resolveToRoute(file);
  return `
declare module "../${options.apiDirectory ?? "api"}${file}" {
  function get(callback: (req: any, res: any) => any | void): RemoveDoubleSlashes<StripTypes<\`${route}\`>>;
  function get<P extends BaseRoute>(path: P, callback: (req: any, res: any) => any | void): RemoveDoubleSlashes<StripTypes<\`${route}\${P}\`>>;
}
  `;
}

/** Filters out the params along with their provided types, first group is param name, second group is optionally the provided type */
const PARAM_REGEX = /\[([^:\]]*)(: {0,1}[a-zA-Z]*){0,}\]/g;

/**
 * Parses the path to remove types
 */
export function parseTypes(path: string) {
  let res: { path: string; types: Record<string, string> } = { path, types: {} };
  let m: RegExpExecArray | null;

  while ((m = PARAM_REGEX.exec(path)) !== null) {
    if (m.index === PARAM_REGEX.lastIndex) PARAM_REGEX.lastIndex++;
    if (m.length === 0) continue;

    res.path = res.path.replace(m[0], `:${m[1]}`);
    res.types[m[1]] =
      m[2] === undefined ? "any" : m[2].trim().replace(":", "") === "bool" ? "boolean" : m[2].trim().replace(":", "");
  }

  return res;
}

/**
 * Verifies the given params, returns true if the params align with the types given, else returns false
 */
export function verifyParams(
  params: Record<string, string | boolean | number | any>,
  types: Record<string, string>
): boolean {
  for (const name in params) {
    const expected = types[name];
    if (!expected) continue; // Should never happen
    const val = params[name];
    // Add more test cases if necessary
    if (expected === "any") continue;
    else if ((val === "true" || val === "false") && expected === "boolean") continue;
    else if (!isNaN(val as number) && !isNaN(parseFloat(val as string)) && expected === "number") continue;
    else if (typeof val === expected) continue;
    else return false;
  }
  return true;
}

/**
 * Removes types from the route parameters
 */
export type StripTypes<Path extends string> = Path extends `${infer Segment}/${infer Rest}`
  ? StripType<Segment, `/${StripTypes<Rest>}`>
  : StripType<Path, "">;
type StripType<Path extends string, Next extends string> = Path extends `[${infer Param}]`
  ? Path extends `[${infer ParamWOT} :${string}]`
    ? `[${ParamWOT}]${Next}`
    : Path extends `[${infer ParamWOT}:${string}]`
    ? `[${ParamWOT}]${Next}`
    : `[${Param}]${Next}`
  : `${Path}${Next}`;

/**
 * Creates an object that represents the params in the route, also includes types if specified
 */
export type ExtractParams<Path> = Path extends `${infer Segment}/${infer Rest}`
  ? ExtractParam<Segment, ExtractParams<Rest>>
  : ExtractParam<Path, {}>;
type ExtractParam<Path, NextPart> = Path extends `[${infer Param}]`
  ? Path extends `[${infer ParamWOT} :${infer Type}]`
    ? Record<ParamWOT, ParseInlineTypes<Trim<Type>>> & NextPart
    : Path extends `[${infer ParamWOT}:${infer Type}]`
    ? Record<ParamWOT, ParseInlineTypes<Trim<Type>>> & NextPart
    : Record<Param, any> & NextPart
  : NextPart;

type Trim<T extends string> = T extends ` ${infer R}` ? R : T extends `${infer R} ` ? R : T;

type ParseInlineTypes<P> = P extends "string"
  ? string
  : P extends "number"
  ? number
  : P extends "boolean" | "bool"
  ? boolean
  : P extends "any"
  ? any
  : unknown;
