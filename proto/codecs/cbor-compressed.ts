import { decodeCBOR, encodeCBOR } from "@dreamlab/vendor/exp-fast-cbor.ts";
import { gzip, ungzip } from "@dreamlab/vendor/pako.ts";
import { PlayPacket } from "../play.ts";
import { PlayCodec } from "./mod.ts";

const COMPRESSION_THRESHOLD = 384; // bytes

export const CBOR_COMPRESSED_CODEC: PlayCodec = {
  encodePacket(packet: PlayPacket): Uint8Array {
    const encoded = encodeCBOR(packet);
    const compressed = encoded.byteLength > COMPRESSION_THRESHOLD;
    const data = compressed ? gzip(encoded) : encoded;

    const final = new Uint8Array(data.length + 1);
    final.set(compressed ? [1] : [0]);
    final.set(data, 1);

    return final;
  },
  decodePacket(data: string | ArrayBufferLike | Blob | ArrayBufferView): PlayPacket {
    if (typeof data === "string")
      throw new TypeError("compressed CBOR decoder expects binary data");

    if (data instanceof Blob) {
      throw new TypeError(`socket binaryType must be set to "arrayBuffer"`);
    }

    const buffer = new Uint8Array("buffer" in data ? data.buffer : data);
    const compressed = buffer[0] === 1;
    const payload = buffer.slice(1);

    const bytes = compressed ? ungzip(payload) : payload;
    const obj = decodeCBOR(bytes);
    return obj as PlayPacket;
  },
};
