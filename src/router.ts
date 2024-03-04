import type { ExtractParams, StripTypes } from "./utils";
import { parseTypes } from "./utils";

/**
 * Creates a router with a specified base which can be used to handle endpoints from a base route
 * @param base The base where all the sub routes will get resolved to
 */
export function router<B extends BaseRoute>(base: B): Router<B> {
  return {
    get<P extends BaseRoute>(_path: P, cb: Listener<FullRoute<B, P>, "get">) {
      let path: LeadingSlash<P> = _path.startsWith("/") ? (_path as LeadingSlash<P>) : (`/${_path}` as LeadingSlash<P>);
      const full = `${base}${path}` as FormatReturn<FullRoute<B, P>>;
      let parsed = parseTypes(full);
      console.log(parsed);

      /* app.get(parsed.path, async (_req, res) => {
        const req = _req as Request<FullRoute<B, P>, "get">;
        if (!verifyParams(req.params, parsed.types)) {
          res.code(400);
          return res.send({
            message: "Incorrect parameter types",
            expected: parsed.types,
            schema: parsed.path
          });
        }
        return await cb(req, res);
      }); */

      return full;
    },
    post<P extends BaseRoute>(_path: P, cb: Listener<FullRoute<B, P>, "post">) {
      let path: LeadingSlash<P> = _path.startsWith("/") ? (_path as LeadingSlash<P>) : (`/${_path}` as LeadingSlash<P>);
      const full = `${base}${path}` as FormatReturn<FullRoute<B, P>>;
      let parsed = parseTypes(full);

      /* app.post(parsed.path, async (_req, res) => {
        const req = _req as Request<FullRoute<B, P>, "post">;
        if (!verifyParams(req.params, parsed.types)) {
          res.code(400);
          return res.send({
            message: "Incorrect parameter types",
            expected: parsed.types,
            schema: parsed.path
          });
        }
        return await cb(req, res);
      }); */

      return full;
    }
  };
}

/**
 * The route can include parameters, wrap a value which will be the var name in two brackets to indicate a route param, like this: `/devices/[id]`.
 * Then the `id` variable can be accessed on the req object `req.params.id`.
 *
 * You can also add type hints to the route parameter, so for example `/devices/[id:number]`, will result in the `req.params.id` having a type of number.
 * But this is pretty strict, there can only be zero or one space before and after the `:`, and there are only a couple of types: `string`, `number`, `boolean` or `bool`.
 * All other types or with more than one space will result in unknown, and values without a type will default to string.
 *
 * ```ts
 * "/devices/[id]" // string
 * "/devices/[id:string]" // string
 * "/devices/[id :string]" // string
 * "/devices/[id: number]" // number
 * "/devices/[id:object]" // any
 * ```
 */
export type BaseRoute = `/${string}`;

/**
 * Ensures path has leading slash
 */
export type LeadingSlash<P extends string> = P extends `/${string}` ? P : `/${P}`;

/**
 * Ensures path has no trailing slash
 */
export type TrailingSlash<P extends string> = P extends `${infer R}/` ? R : P;

type FullRoute<B extends string, P extends string> = `${B}${LeadingSlash<P>}`;

export type RemoveDoubleSlashes<Path extends string> = Path extends `${infer Segment}//${infer Rest}`
  ? RemoveDoubleSlashes<`${Segment}/${RemoveDoubleSlashes<Rest>}`>
  : Path;

export type Format<Path extends string> = LeadingSlash<TrailingSlash<RemoveDoubleSlashes<Path>>>;
export type FormatReturn<Path extends string> = LeadingSlash<TrailingSlash<RemoveDoubleSlashes<StripTypes<Path>>>>;

type Method = "get" | "post";

// TODO: Also add logger as third param
/**
 * The callback attached to the listener.
 * It has two objects as parameters, the `request` and `response` object.
 *
 * @param P The path that this listener belongs to
 * @param M The method of the listener: "get", "post", etc.
 */
export type Listener<B extends string, M extends Method> = (
  req: Request<B, M>,
  res: Response
) => void | any | Promise<void> | Promise<any>;

export interface Router<B extends string> {
  /**
   * @param path The path that this function should respond to, this is relative to the provided path in the router function, see return type for full route.
   * See {@link BaseRoute} for more info on valid route schemes
   */
  //get(cb: Listener<B, "get">): StripTypes<B>;
  get<P extends BaseRoute>(path: P, cb: Listener<FullRoute<B, P>, "get">): FormatReturn<FullRoute<B, P>>;
  post<P extends BaseRoute>(path: P, cb: Listener<FullRoute<B, P>, "post">): FormatReturn<FullRoute<B, P>>;
}

// Request
export interface Request<P extends string, M extends Method> {
  /**
   * The params used in the url, will be inferred from path argument
   */
  params: ExtractParams<P>;
  method: M;
}

// Response
export interface Response {}
