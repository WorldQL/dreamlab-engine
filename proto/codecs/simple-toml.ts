import { PlayPacket } from "../play.ts";
import { PlayCodec } from "./mod.ts";
import * as toml from "jsr:@std/toml";

/** @deprecated please dont use this */
export const TOML_CODEC: PlayCodec = {
  encodePacket(packet: PlayPacket): string {
    return toml.stringify(packet);
  },
  decodePacket(data: string | ArrayBufferLike | Blob | ArrayBufferView): PlayPacket {
    if (typeof data !== "string") throw new Error("SimpleTomlCodec expects string data!");
    const obj = toml.parse(data);
    return obj as PlayPacket;
  },
};
