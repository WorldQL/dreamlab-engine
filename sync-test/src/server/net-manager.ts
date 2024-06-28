import {
  ConnectionId,
  CustomMessageData,
  ServerNetworking,
  ServerGame,
  CustomMessageListener,
} from "@dreamlab/engine";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { ClientPacket, PlayPacket } from "@dreamlab/proto/play.ts";
import { ClientConnection } from "../client/net-connection.ts";

import { handleSyncedValues } from "./synced-values.ts";
import { handleCustomMessages } from "./custom-messages.ts";

export type ServerPacketHandleFunction<T extends ClientPacket["t"]> = (
  from: ConnectionId,
  packet: PlayPacket<T, "client">,
) => void;
export type ServerPacketHandler<T extends ClientPacket["t"]> = (
  net: ServerNetworkManager,
  game: ServerGame,
) => ServerPacketHandleFunction<T>;

export class ServerNetworkManager {
  clients = new Map<ConnectionId, ClientConnection>();
  connect(): ClientConnection {
    const connection = new ClientConnection(generateCUID("conn"), this);
    this.clients.set(connection.id, connection);
    return connection;
  }

  #game: ServerGame | undefined;

  customMessageListeners: CustomMessageListener[] = [];

  #packetHandlers: Partial<
    Record<ClientPacket["t"], ServerPacketHandleFunction<ClientPacket["t"]>>
  > = {};
  #setupPacketHandler<T extends ClientPacket["t"]>(t: T, handler: ServerPacketHandler<T>) {
    const game = this.#game!;
    this.#packetHandlers[t] = handler(this, game) as ServerPacketHandleFunction<
      ClientPacket["t"]
    >;
  }
  getPacketHandler<T extends ClientPacket["t"]>(t: T): ServerPacketHandleFunction<T> {
    const handler = this.#packetHandlers[t];
    if (handler === undefined) throw new Error("Handler for " + t + " has not been set up!");
    return handler as ServerPacketHandleFunction<ClientPacket["t"]>;
  }

  setup(game: ServerGame) {
    this.#game = game;

    this.#setupPacketHandler("SetSyncedValue", handleSyncedValues);
    this.#setupPacketHandler("CustomMessage", handleCustomMessages);
  }

  handle(from: ConnectionId, packet: PlayPacket<undefined, "client">) {
    try {
      this.getPacketHandler(packet.t)(from, packet);
    } catch (err) {
      console.warn("Uncaught error while handling packet: " + err);
    }
  }

  send(to: ConnectionId, packet: PlayPacket<undefined, "server">) {
    const client = this.clients.get(to);
    if (!client) return;
    client.handle(packet);
  }
  broadcast(packet: PlayPacket<undefined, "server">) {
    for (const client of this.clients.values()) client.handle(packet);
  }

  createNetworking(): ServerNetworking {
    // deno-lint-ignore no-this-alias
    const net = this;

    return {
      get peers(): ConnectionId[] {
        return [...net.clients.keys()];
      },
      sendCustomMessage(to: ConnectionId, channel: string, data: CustomMessageData) {
        net.send(to, { t: "CustomMessage", channel, data });
      },
      broadcastCustomMessage(channel: string, data: CustomMessageData) {
        net.broadcast({ t: "CustomMessage", channel, data });
      },
      onReceiveCustomMessage(listener: CustomMessageListener) {
        net.customMessageListeners.push(listener);
      },
    };
  }
}
