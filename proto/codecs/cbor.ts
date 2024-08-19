import { Decoder, Encoder } from "@dreamlab/vendor/cbor-x.ts";
import { PlayPacket } from "../play.ts";
import { PlayCodec } from "./mod.ts";

const encoder = new Encoder();
const decoder = new Decoder();

export const CBOR_CODEC: PlayCodec = {
  encodePacket(packet: PlayPacket): string {
    return encoder.encode(packet);
  },
  decodePacket(data: string | ArrayBufferLike | Blob | ArrayBufferView): PlayPacket {
    if (typeof data === "string") throw new TypeError("CBOR decoder expects binary data");

    if (data instanceof Blob) {
      throw new TypeError(`socket binaryType must be set to "arrayBuffer"`);
    }

    const buffer = "buffer" in data ? data.buffer : data;
    const obj = decoder.decode(new Uint8Array(buffer));
    return obj as PlayPacket;
  },
};
