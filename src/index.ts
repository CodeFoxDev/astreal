export type BaseRoute = `/${string}`;

export type EnsureSlash<P extends string> = P extends `/${string}` ? P : `/${P}`;

type StripType<Path extends string, Next extends string> = Path extends `[${infer Param}]`
  ? Path extends `[${infer ParamWOT} :${string}]`
    ? `[${ParamWOT}]${Next}`
    : Path extends `[${infer ParamWOT}:${string}]`
    ? `[${ParamWOT}]${Next}`
    : `[${Param}]${Next}`
  : `${Path}${Next}`;

export type StripTypes<Path extends string> = Path extends `${infer Segment}/${infer Rest}`
  ? StripType<Segment, `/${StripTypes<Rest>}`>
  : StripType<Path, "">;

export type RemoveDoubleSlashes<Path extends string> = Path extends `${infer Segment}//${infer Rest}`
  ? RemoveDoubleSlashes<`${Segment}/${RemoveDoubleSlashes<Rest>}`>
  : Path;
