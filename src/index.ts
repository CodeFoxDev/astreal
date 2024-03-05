export type { BaseRoute, LeadingSlash, TrailingSlash, Request, Response, Router, Listener } from "./router";
export { router } from "./router";

import type { ClientRequest, ServerResponse, RequestListener } from "node:http";
import { existsSync as exists } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

type Astreal = RequestListener & {
  listen: () => void;
  /**
   * Loads the functions from the filesystem router.
   */
  api: () => Promise<void>;
};

// TODO: Fix that it should result to built file
const root = join(process.cwd(), "dist");

/**
 * Creates the actual app itself, returns a request handler that can be attached to the `node:http` createServer listener.
 * Also returns some functions to help with the application.
 */
export default function astreal(): Astreal {
  const handler: Astreal = (req, res) => {};

  handler.api = async () => {
    // TODO: Add check to get from correct `routerDir`
    const routerDir = join(root, "api");
    if (!exists(routerDir)) throw new Error("Failed to resolve api directory, /api folder not found");
    let res: { files: string[]; load: () => void };
    try {
      res = await import(pathToFileURL(join(routerDir, "__routes.js")).href);
    } catch (e) {
      throw new Error(`Failed to resolve routes file, nodejs err: ${e}`);
    }

    res.load();
  };

  handler.listen = () => null;

  return handler;
}

export { astreal };
