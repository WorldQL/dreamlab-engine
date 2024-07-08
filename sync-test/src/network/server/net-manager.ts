import {
  ConnectionId,
  CustomMessageData,
  ServerNetworking,
  ServerGame,
  CustomMessageListener,
} from "@dreamlab/engine";
// import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { ClientPacket, PlayPacket } from "@dreamlab/proto/play.ts";
import { ClientConnection } from "../client/net-connection.ts";

import { handleSyncedValues } from "./synced-values.ts";
import { handleCustomMessages } from "./custom-messages.ts";
import { handleEntitySync } from "./entity-sync.ts";
import { handleTransformSync } from "./transform-sync.ts";

export type ServerPacketHandler<T extends ClientPacket["t"]> = (
  from: ConnectionId,
  packet: PlayPacket<T, "client">,
) => void;
export type ServerNetworkSetupRoutine = (net: ServerNetworkManager, game: ServerGame) => void;

export class ServerNetworkManager {
  clients = new Map<ConnectionId, ClientConnection>();
  connect(): ClientConnection {
    const connection = new ClientConnection(`conn_${this.clients.size + 1}`, this);
    this.clients.set(connection.id, connection);
    return connection;
  }

  customMessageListeners: CustomMessageListener[] = [];

  #packetHandlers: Partial<Record<ClientPacket["t"], ServerPacketHandler<ClientPacket["t"]>>> =
    {};
  registerPacketHandler<T extends ClientPacket["t"]>(t: T, handler: ServerPacketHandler<T>) {
    this.#packetHandlers[t] = handler as ServerPacketHandler<ClientPacket["t"]>;
  }
  getPacketHandler<T extends ClientPacket["t"]>(t: T): ServerPacketHandler<T> {
    const handler = this.#packetHandlers[t];
    if (handler === undefined) throw new Error("Handler for " + t + " has not been set up!");
    return handler as ServerPacketHandler<ClientPacket["t"]>;
  }

  setup(game: ServerGame) {
    handleSyncedValues(this, game);
    handleCustomMessages(this, game);
    handleEntitySync(this, game);
    handleTransformSync(this, game);
  }

  handle(from: ConnectionId, packet: PlayPacket<undefined, "client">) {
    console.log("server [<-] " + JSON.stringify(packet));

    try {
      this.getPacketHandler(packet.t)(from, packet);
    } catch (err) {
      console.warn("Uncaught error while handling packet: " + err);
    }
  }

  send(to: ConnectionId, packet: PlayPacket<undefined, "server">) {
    const client = this.clients.get(to);
    if (!client) return;
    console.log("server => " + to + " [->] " + JSON.stringify(packet));
    client.handle(packet);
  }
  broadcast(packet: PlayPacket<undefined, "server">) {
    console.log("server [->] " + JSON.stringify(packet));

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
