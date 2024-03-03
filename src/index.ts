export type { BaseRoute, LeadingSlash, TrailingSlash, Request, Response, Router, Listener } from "./router";
export { router } from "./router";

import type { ClientRequest, ServerResponse, RequestListener } from "node:http";

type Astreal = RequestListener & {
  listen: () => void;
};

/**
 * Creates the actual app itself, returns a request handler that can be attached to the `node:http` createServer listener.
 */
export default function astreal(): Astreal {
  const handler: Astreal = (req, res) => {};

  handler.listen = () => null;

  return handler;
}

export { astreal };
