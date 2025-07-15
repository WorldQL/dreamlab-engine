import { gzip, ungzip } from "@dreamlab/vendor/pako.ts";
import { decodeBase64, encodeBase64 } from "@dreamlab/vendor/std__encoding.ts";
import { PlayPacket } from "../play.ts";
import { PlayCodec } from "./mod.ts";

const DREAMLAB_TYPE_MARKER = "$dreamlab\0Type";

export const JSON_CODEC: PlayCodec = {
  encodePacket(packet: PlayPacket): string {
    return JSON.stringify(packet, function (_key, value) {
      if (value instanceof Uint8Array) {
        const data = {
          gzip: 0,
          data: value,
        };

        if (value.byteLength < 384) {
          // do nothing
        } else if (value.byteLength < 4096) {
          data.gzip = 1;
          data.data = gzip(data.data);
        } else {
          data.gzip = 2;
          data.data = gzip(gzip(data.data));
        }

        return {
          [DREAMLAB_TYPE_MARKER]: "Uint8Array",
          gzip: data.gzip,
          data: encodeBase64(data.data),
        };
      }

      return value;
    });
  },
  decodePacket(data: string | ArrayBufferLike | Blob | ArrayBufferView): PlayPacket {
    if (typeof data !== "string") throw new Error("SimpleJsonCodec expects string data!");
    const obj = JSON.parse(data, function (_key, value) {
      if (value === null || typeof value !== "object" || !(DREAMLAB_TYPE_MARKER in value)) {
        return value;
      }

      if (value[DREAMLAB_TYPE_MARKER] === "Uint8Array") {
        if (typeof value.gzip !== "number") throw new TypeError();
        if (typeof value.data !== "string") throw new TypeError();

        const gzip = Math.min(value.gzip, 2);
        let data: Uint8Array<ArrayBufferLike> = decodeBase64(value.data);

        for (let i = 0; i < gzip; i++) {
          data = ungzip(data);
        }

        return data;
      }

      return value;
    });
    return obj as PlayPacket;
  },
};
