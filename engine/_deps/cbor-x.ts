// deno-lint-ignore-file no-explicit-any
import { Vector2 } from "@dreamlab/engine";
import type { Constructor } from "@dreamlab/vendor/type-fest.ts";
import { Encoder, addExtension } from "https://deno.land/x/cbor@v1.6.0/index.js";

export function registerCborExtensions(types: { Vector2: Constructor<Vector2> }): void {
  let tag = 40500;
  const register = <T>(opts: {
    ctor: Constructor<T>;
    encode: (instance: T) => any;
    decode: (data: any) => T;
  }): void => {
    addExtension({
      Class: opts.ctor,
      tag: ++tag,
      encode(instance: T, encode: Encoder["encode"]): void {
        encode(opts.encode(instance));
      },
      decode(data: any): T {
        return opts.decode(data);
      },
    });
  };

  register({
    ctor: types.Vector2,
    encode: instance => instance.bare(),
    decode: data => new types.Vector2(data.x, data.y),
  });
}

export * from "https://deno.land/x/cbor@v1.6.0/index.js";
