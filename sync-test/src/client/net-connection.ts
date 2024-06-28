import {
  ConnectionId,
  CustomMessageData,
  ClientNetworking,
  ClientGame,
  CustomMessageListener,
} from "@dreamlab/engine";
import { PlayPacket, ServerPacket } from "@dreamlab/proto/play.ts";

import { ServerNetworkManager } from "../server/net-manager.ts";
import { handleCustomMessages } from "./custom-messages.ts";
import { handleSyncedValues } from "./synced-values.ts";

export type ClientPacketHandleFunction<T extends ServerPacket["t"]> = (
  packet: PlayPacket<T, "server">,
) => void;
export type ClientPacketHandler<T extends ServerPacket["t"]> = (
  conn: ClientConnection,
  game: ClientGame,
) => ClientPacketHandleFunction<T>;

export class ClientConnection {
  constructor(
    public id: ConnectionId,
    public server: ServerNetworkManager,
  ) {}

  #game: ClientGame | undefined;
  customMessageListeners: CustomMessageListener[] = [];

  #packetHandlers: Partial<
    Record<ServerPacket["t"], ClientPacketHandleFunction<ServerPacket["t"]>>
  > = {};
  #setupPacketHandler<T extends ServerPacket["t"]>(t: T, handler: ClientPacketHandler<T>) {
    const game = this.#game!;
    this.#packetHandlers[t] = handler(this, game) as ClientPacketHandleFunction<
      ServerPacket["t"]
    >;
  }
  getPacketHandler<T extends ServerPacket["t"]>(t: T): ClientPacketHandleFunction<T> {
    const handler = this.#packetHandlers[t];
    if (handler === undefined) throw new Error("Handler for " + t + " has not been set up!");
    return handler as ClientPacketHandleFunction<ServerPacket["t"]>;
  }

  setup(game: ClientGame) {
    this.#game = game;
    this.#setupPacketHandler("SetSyncedValue", handleSyncedValues);
    this.#setupPacketHandler("CustomMessage", handleCustomMessages);
  }

  handle(packet: PlayPacket<undefined, "server">) {
    try {
      this.getPacketHandler(packet.t)(packet);
    } catch (err) {
      console.warn("Uncaught error while handling packet: " + err);
    }
  }

  send(packet: PlayPacket<undefined, "client">) {
    this.server.handle(this.id, packet);
  }

  createNetworking(): ClientNetworking {
    // deno-lint-ignore no-this-alias
    const conn = this;

    return {
      get connectionId() {
        return conn.id;
      },
      get peers(): ConnectionId[] {
        // TODO: track peers
        return [];
      },
      sendCustomMessage(to: ConnectionId, channel: string, data: CustomMessageData) {
        conn.send({ t: "CustomMessage", channel, data, to });
      },
      broadcastCustomMessage(channel: string, data: CustomMessageData) {
        conn.send({ t: "CustomMessage", channel, data, to: "*" });
      },
      onReceiveCustomMessage(listener: CustomMessageListener) {
        conn.customMessageListeners.push(listener);
      },
    };
  }
}
