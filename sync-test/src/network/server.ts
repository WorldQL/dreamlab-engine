import {
  ConnectionId,
  CustomMessageData,
  ServerNetworking,
  ServerGame,
  SyncedValueChanged,
  CustomMessageListener,
} from "@dreamlab/engine";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { PlayPacket } from "@dreamlab/proto/play.ts";

import { ClientConnection } from "./client.ts";

export class ServerNetworkManager {
  clients = new Map<ConnectionId, ClientConnection>();
  connect(): ClientConnection {
    const connection = new ClientConnection(generateCUID("conn"), this);
    this.clients.set(connection.id, connection);
    return connection;
  }

  #game: ServerGame | undefined;
  get game(): ServerGame {
    if (this.#game === undefined)
      throw new Error("ServerNetworkManager tried to access game before setup");
    return this.#game;
  }

  customMessageListeners: CustomMessageListener[] = [];

  setup(game: ServerGame) {
    this.#game = game;

    game.syncedValues.on(SyncedValueChanged, event => {
      if (!event.value.replicated) return;

      const value = event.value.adapter
        ? event.value.adapter.convertToPrimitive(event.newValue)
        : event.newValue;

      this.broadcast({
        t: "SetSyncedValue",
        identifier: event.value.identifier,
        generation: event.generation,
        value,
        originator: event.originator,
      });
    });
  }

  handle(from: ConnectionId, packet: PlayPacket<undefined, "client">) {
    const game = this.game;

    switch (packet.t) {
      case "SetSyncedValue": {
        const value = game.syncedValues.lookup(packet.identifier);
        if (!value || !value.replicated) return;

        game.syncedValues.fire(
          SyncedValueChanged,
          value,
          packet.value,
          packet.generation,
          from,
        );
        break;
      }

      case "CustomMessage": {
        if (packet.to === undefined) {
          for (const listener of this.customMessageListeners) {
            try {
              const r = listener(from, packet.channel, packet.data);
              if (r instanceof Promise) {
                r.catch(err => console.warn("Error calling custom message listener: " + err));
              }
            } catch (err) {
              console.warn("Error calling custom message listener: " + err);
            }
          }
        } else if (packet.to === "*") {
          this.broadcast({
            t: "CustomMessage",
            channel: packet.channel,
            data: packet.data,
            originator: from,
          });
        } else {
          this.send(packet.to, {
            t: "CustomMessage",
            channel: packet.channel,
            data: packet.data,
            originator: from,
          });
        }
      }
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
      onReceiveCustomMessage(listener: CustomMessageListener) {
        manager.customMessageListeners.push(listener);
      },
    };
  }
}
