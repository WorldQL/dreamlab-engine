// ignore this i cant make it go away
// esbuild handles this
import _json from "env";
const env = _json as Record<string, string>;
Object.assign(globalThis, { env });

declare global {
  interface ImportMetaEnv {
    [key: string]: string;
  }

  // deno-lint-ignore no-var
  var env: ImportMetaEnv;
}
