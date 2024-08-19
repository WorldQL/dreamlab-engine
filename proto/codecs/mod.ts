import { PlayPacket } from "../play.ts";
import { CBOR_CODEC } from "./cbor.ts";
import { JSON_CODEC } from "./simple-json.ts";

export interface PlayCodec {
  encodePacket(
    packet: PlayPacket<undefined, "any">,
  ): string | ArrayBufferLike | Blob | ArrayBufferView;
  decodePacket(
    data: string | ArrayBufferLike | Blob | ArrayBufferView,
  ): PlayPacket<undefined, "any">;
}

export * from "./cbor.ts";
export * from "./simple-json.ts";
export * from "./simple-toml.ts";

const binary = false;
export const DEFAULT_CODEC = binary ? CBOR_CODEC : JSON_CODEC;
