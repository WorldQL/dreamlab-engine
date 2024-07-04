import { ClientToServerPacket } from "./client-to-server.ts";
import { ServerToClientPacket } from "./server-to-client.ts";

export const PLAY_PROTO_VERSION = 11;

export * from "./shared.ts";
export * from "./client-to-server.ts";
export * from "./server-to-client.ts";

export type Packet<
  T extends string,
  Side extends "server" | "client" | "both" = "both",
> =
  & (Side extends "both" ? ClientToServerPacket | ServerToClientPacket
    : Side extends "client" ? ClientToServerPacket
    : ServerToClientPacket)
  & { t: T };
