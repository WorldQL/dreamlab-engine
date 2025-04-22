import { PlayPacket } from "../play.ts";
import { CBOR_COMPRESSED_CODEC } from "./cbor-compressed.ts";
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

export type Codec = (typeof codecTypes)[number];
const codecTypes = ["CBOR", "CBOR_COMPRESSED", "JSON"] as const;

export function isCodec(codec: unknown): codec is Codec {
  return typeof codec === "string" && codecTypes.includes(codec as Codec);
}

export const CODECS = {
  CBOR: CBOR_CODEC,
  CBOR_COMPRESSED: CBOR_COMPRESSED_CODEC,
  JSON: JSON_CODEC,
} satisfies Record<Codec, PlayCodec>;

export function getCodec(codec: Codec | undefined): PlayCodec {
  if (codec === undefined) return CODECS.CBOR_COMPRESSED;

  if (!isCodec(codec)) throw new Error(`invalid codec: ${codec}`);
  return CODECS[codec];
}
