import { PlayPacket } from "../play.ts";

export interface PlayCodec {
  encodePacket(
    packet: PlayPacket<undefined, "any">,
  ): string | ArrayBufferLike | Blob | ArrayBufferView;
  decodePacket(
    data: string | ArrayBufferLike | Blob | ArrayBufferView,
  ): PlayPacket<undefined, "any">;
}
