import {
  ConnectionId,
  CustomMessageData,
  ClientNetworking,
  ServerNetworking,
} from "@dreamlab/engine";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { PlayPacket } from "@dreamlab/proto/play.ts";

// these are directly wired up to each other instead of using a WebSocket, because we
// are just running within one browser tab for the sync test

// TODO: we need to get the Game obj into these (for doing things in handle(..)),
// but they have to be alive before game so that we can createNetworkig() for the Game constructor

export class ClientConnection {
  constructor(
    public id: ConnectionId,
    public server: ServerNetworkManager,
  ) {}

  send(packet: PlayPacket<undefined, "client">) {
    this.server.handle(packet);
  }

  handle(packet: PlayPacket<undefined, "server">) {
    // TODO
  }

  createNetworking(): ClientNetworking {
    // deno-lint-ignore no-this-alias
    const connection = this;

    return {
      get connectionId() {
        return connection.id;
      },
      get peers(): ConnectionId[] {
        // TODO: track peers
        return [];
      },
      sendCustomMessage(to: ConnectionId, channel: string, data: CustomMessageData) {
        connection.send({ t: "CustomMessage", channel, data, to });
      },
      broadcastCustomMessage(channel: string, data: CustomMessageData) {
        connection.send({ t: "CustomMessage", channel, data, to: "*" });
      },
      onReceiveCustomMessage() {
        throw new Error("Method not implemented.");
      },
    };
  }
}

export class ServerNetworkManager {
  clients = new Map<ConnectionId, ClientConnection>();

  connect(): ClientConnection {
    return new ClientConnection(generateCUID("conn"), this);
  }

  send(to: ConnectionId, packet: PlayPacket<undefined, "server">) {
    const client = this.clients.get(to);
    if (!client) return;
    client.handle(packet);
  }
  broadcast(packet: PlayPacket<undefined, "server">) {
    for (const client of this.clients.values()) client.handle(packet);
  }

  handle(packet: PlayPacket<undefined, "client">) {}

  createNetworking(): ServerNetworking {
    // deno-lint-ignore no-this-alias
    const manager = this;

    return {
      get peers(): ConnectionId[] {
        return [...manager.clients.keys()];
      },
      sendCustomMessage(to: ConnectionId, channel: string, data: CustomMessageData) {
        manager.send(to, { t: "CustomMessage", channel, data });
      },
      broadcastCustomMessage(channel: string, data: CustomMessageData) {
        manager.broadcast({ t: "CustomMessage", channel, data });
      },
      onReceiveCustomMessage() {
        throw new Error("Method not implemented.");
      },
    };
  }
}
