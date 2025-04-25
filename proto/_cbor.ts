import { Vector2 } from "@dreamlab/engine";
import { Decoder, Encoder, registerCborExtensions } from "@dreamlab/vendor/cbor-x.ts";

registerCborExtensions({ Vector2 });

export const encoder = new Encoder();
export const decoder = new Decoder({});
