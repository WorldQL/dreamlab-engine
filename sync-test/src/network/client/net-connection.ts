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
import { handleEntitySync } from "./entity-sync.ts";

export type ClientPacketHandler<T extends ServerPacket["t"]> = (
  packet: PlayPacket<T, "server">,
) => void;
export type ClientNetworkSetupRoutine = (conn: ClientConnection, game: ClientGame) => void;

export class ClientConnection {
  constructor(
    public id: ConnectionId,
    public server: ServerNetworkManager,
  ) {}

  customMessageListeners: CustomMessageListener[] = [];

  #packetHandlers: Partial<Record<ServerPacket["t"], ClientPacketHandler<ServerPacket["t"]>>> =
    {};
  registerPacketHandler<T extends ServerPacket["t"]>(t: T, f: ClientPacketHandler<T>) {
    this.#packetHandlers[t] = f as ClientPacketHandler<ServerPacket["t"]>;
  }
  getPacketHandler<T extends ServerPacket["t"]>(t: T): ClientPacketHandler<T> {
    const handler = this.#packetHandlers[t];
    if (handler === undefined) throw new Error("Handler for " + t + " has not been set up!");
    return handler as ClientPacketHandler<ServerPacket["t"]>;
  }

  setup(game: ClientGame) {
    handleSyncedValues(this, game);
    handleCustomMessages(this, game);
    handleEntitySync(this, game);
  }

  handle(packet: PlayPacket<undefined, "server">) {
    console.log(this.id + " [<-] " + JSON.stringify(packet));

    try {
      this.getPacketHandler(packet.t)(packet);
    } catch (err) {
      console.warn(`Uncaught error while handling packet of type '${packet.t}': ${err}`);
    }
  }

  send(packet: PlayPacket<undefined, "client">) {
    this.server.handle(this.id, packet);

    console.log(this.id + " [->] " + JSON.stringify(packet));
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
