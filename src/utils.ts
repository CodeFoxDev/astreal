import type { Options } from "./plugin";
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

export function resolveToRoute(path: string) {
  if (path.endsWith(".ts") || path.endsWith(".js")) path = path.slice(0, -3);
  if (path.endsWith("/index")) path = path.replace("/index", "");
  return path;
}

function ensureDirRel(dir: string, content?: string) {
  const f = path.join(process.cwd(), dir);
  if (!fs.existsSync(f)) fs.writeFileSync(f, content ?? "", { encoding: "utf-8" });
}

// Declarations
// TODO: Add removeTrailing and compact this maybe
const baseContent = `export {};
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

export function generateDeclarations(files: string[], options: Options) {
  let res = baseContent;

  for (const f of files) res += generateModuleCode(f, options);
  return {
    content: res,
    write() {
      ensureDirRel(".astreal");
      fs.writeFileSync(path.join(process.cwd(), ".astreal/declarations.d.ts"), res);
    }
  };
}

function generateModuleCode(file: string, options: Options) {
  const route = resolveToRoute(file);
  return `
declare module "../${options.routerDir ?? "api"}${file}" {
  function get(callback: (req: any, res: any) => any | void): RemoveDoubleSlashes<StripTypes<\`${route}\`>>;
  function get<P extends BaseRoute>(path: P, callback: (req: any, res: any) => any | void): RemoveDoubleSlashes<StripTypes<\`${route}\${P}\`>>;
}
  `;
}
