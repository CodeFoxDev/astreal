export type BaseRoute = `/${string}`;

/** Ensures path has leading slash */
export type LeadingSlash<P extends string> = P extends `/${string}` ? P : `/${P}`;

/** Ensures path has no trailing slash */
export type TrailingSlash<P extends string> = P extends `${infer R}/` ? R : P;

export type RemoveDoubleSlashes<Path extends string> = Path extends `${infer Segment}//${infer Rest}`
  ? RemoveDoubleSlashes<`${Segment}/${RemoveDoubleSlashes<Rest>}`>
  : Path;

type Trim<T extends string> = T extends ` ${infer R}` ? R : T extends `${infer R} ` ? R : T;

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

export type Format<Path extends string> = LeadingSlash<TrailingSlash<RemoveDoubleSlashes<Path>>>;
export type FormatReturn<Path extends string> = LeadingSlash<TrailingSlash<RemoveDoubleSlashes<StripTypes<Path>>>>;

type Method = "get" | "post";

type ParseInlineTypes<P> = P extends "string"
  ? string
  : P extends "number"
  ? number
  : P extends "boolean" | "bool"
  ? boolean
  : P extends "any"
  ? any
  : unknown;

/**
 * @param P The path that this listener belongs to
 * @param M The method of the listener: "get", "post", etc.
 */
export type Listener<P extends string, M extends Method> = (
  req: Request<P, M>,
  res: Response
) => void | any | Promise<void> | Promise<any>;

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
