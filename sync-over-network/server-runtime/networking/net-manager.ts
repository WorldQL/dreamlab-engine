import {
  ConnectionId,
  CustomMessageData,
  CustomMessageListener,
  ServerGame,
  ServerNetworking,
} from "@dreamlab/engine";
import {
  ClientPacket,
  PLAY_PROTO_VERSION,
  PlayPacket,
  ServerPacket,
} from "@dreamlab/proto/play.ts";
import { IPCMessageBus } from "../ipc.ts";
import { handleValueChanges } from "./value-changes.ts";
import { handleCustomMessages } from "./custom-messages.ts";
import { handleEntitySync } from "./entity-sync.ts";
import { handleTransformSync } from "./transform-sync.ts";

export type ServerPacketHandler<T extends ClientPacket["t"]> = (
  from: ConnectionId,
  packet: PlayPacket<T, "client">,
) => void;
export type ServerNetworkSetupRoutine = (net: ServerNetworkManager, game: ServerGame) => void;

export class ServerNetworkManager {
  clients = new Set<ConnectionId>();

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

  constructor(private ipc: IPCMessageBus) {
    ipc.addMessageListener("IncomingPacket", message => {
      try {
        this.getPacketHandler(message.packet.t)(message.from, message.packet);
      } catch (err) {
        console.warn(
          `Uncaught error while handling packet of type '${message.packet.t}': ${err}`,
        );
      }
    });

    ipc.addMessageListener("ConnectionEstablished", message => {
      this.send(message.connectionId, {
        t: "Handshake",
        connection_id: message.connectionId,
        version: PLAY_PROTO_VERSION,
        world_id: ipc.workerData.worldId,
        player_id: message.playerId,
      });

      this.broadcast({
        t: "PeerConnected",
        nickname: message.nickname,
        player_id: message.playerId,
        connection_id: message.connectionId,
      });

      // TODO: create playerconnection entity and put it in game.remote
      this.clients.add(message.connectionId);
    });
  }

  setup(game: ServerGame) {
    handleValueChanges(this, game);
    handleCustomMessages(this, game);
    handleEntitySync(this, game);
    handleTransformSync(this, game);
  }

  send(to: ConnectionId, packet: ServerPacket) {
    if (to === undefined) return;
    this.ipc.send({ op: "OutgoingPacket", to, packet });
  }

  broadcast(packet: ServerPacket) {
    this.ipc.send({ op: "OutgoingPacket", to: null, packet });
  }

  createNetworking(): ServerNetworking {
    // deno-lint-ignore no-this-alias
    const net = this;

    return {
      get connectionId(): ConnectionId {
        return undefined;
      },
      get peers(): ConnectionId[] {
        return [...net.clients.values()];
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
