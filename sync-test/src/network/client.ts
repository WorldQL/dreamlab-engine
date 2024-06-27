import {
  ConnectionId,
  CustomMessageData,
  ClientNetworking,
  ClientGame,
  SyncedValueChanged,
  CustomMessageListener,
} from "@dreamlab/engine";
import { PlayPacket } from "@dreamlab/proto/play.ts";

import { ServerNetworkManager } from "./server.ts";

export class ClientConnection {
  #game: ClientGame | undefined;
  get game(): ClientGame {
    if (this.#game === undefined)
      throw new Error("ClientConnection tried to access game before setup");
    return this.#game;
  }

  customMessageListeners: CustomMessageListener[] = [];

  constructor(
    public id: ConnectionId,
    public server: ServerNetworkManager,
  ) {}

  setup(game: ClientGame) {
    this.#game = game;

    game.syncedValues.on(SyncedValueChanged, event => {
      if (!event.value.replicated) return;
      if (event.originator !== this.id) return;

      const value = event.value.adapter
        ? event.value.adapter.convertToPrimitive(event.newValue)
        : event.newValue;

      this.send({
        t: "SetSyncedValue",
        identifier: event.value.identifier,
        value,
        generation: event.generation,
      });
    });
  }

  handle(packet: PlayPacket<undefined, "server">) {
    const game = this.game;

    switch (packet.t) {
      case "SetSyncedValue": {
        if (packet.originator === this.id) return;

        const value = game.syncedValues.lookup(packet.identifier);
        if (!value || !value.replicated) return;

        game.syncedValues.fire(
          SyncedValueChanged,
          value,
          packet.value,
          packet.generation,
          packet.originator,
        );

        break;
      }

      case "CustomMessage": {
        for (const listener of this.customMessageListeners) {
          try {
            const r = listener(packet.originator, packet.channel, packet.data);
            if (r instanceof Promise) {
              r.catch(err => console.warn("Error calling custom message listener: " + err));
            }
          } catch (err) {
            console.warn("Error calling custom message listener: " + err);
          }
        }
        break;
      }
    }
  }

  send(packet: PlayPacket<undefined, "client">) {
    this.server.handle(this.id, packet);
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
      onReceiveCustomMessage(listener: CustomMessageListener) {
        connection.customMessageListeners.push(listener);
      },
    };
  }
}
