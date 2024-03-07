export interface Options {
  /**
   * The base directory of the api, relative to the working directory
   * @default 'api'
   */
  apiDirectory?: string;

  // TODO: (currently always true)
  /**
   * If true, will provide globals to all files in the api directory, this has the advantage of providing more ts support,
   * like adding the full route to the req object and resolving route params in directory names,
   * if set to false, you will have to import the handlers yourself to get type information.
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
   * Specifies where to generate the `.astreal` folder for the type information, set to null to disable this behaviour
   * @default "project"
   */
  typeFolderLocation?: "project" | "node_modules" | null;

  //bundleFiles: boolean;
}

export interface ResolvedOptions {
  apiDirectory: string;
  provideGlobals: boolean;
  allowModifyingTSConfig: boolean;
  typeFolderLocation: "project" | "node_modules" | null;
}

export function resolveOptions(options?: Options) {
  options ??= {};

  if (typeof options.apiDirectory !== "string") options.apiDirectory = "api";
  if (typeof options.provideGlobals !== "boolean") options.provideGlobals = true;
  if (typeof options.allowModifyingTSConfig !== "boolean") options.allowModifyingTSConfig = false;
  if (
    options.typeFolderLocation !== "project" &&
    options.typeFolderLocation !== "node_modules" &&
    options.typeFolderLocation !== null
  )
    options.typeFolderLocation = "project";

  return options as ResolvedOptions;
}
