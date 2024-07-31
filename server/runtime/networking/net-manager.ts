import {
  ConnectionId,
  CustomMessageData,
  CustomMessageListener,
  PeerInfo,
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
import { PeerConnected, PeerDisconnected } from "@dreamlab/proto/common/signals.ts";

export type ServerPacketHandler<T extends ClientPacket["t"]> = (
  from: ConnectionId,
  packet: PlayPacket<T, "client">,
) => void;
export type ServerNetworkSetupRoutine = (net: ServerNetworkManager, game: ServerGame) => void;

export class ServerNetworkManager {
  clients = new Map<ConnectionId, PeerInfo>();

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

  constructor(private ipc: IPCMessageBus) {}

  setup(game: ServerGame) {
    this.ipc.addMessageListener("IncomingPacket", message => {
      try {
        this.getPacketHandler(message.packet.t)(message.from, message.packet);
      } catch (err) {
        console.warn(
          `Uncaught error while handling packet of type '${message.packet.t}': ${err}`,
        );
      }
    });

    this.ipc.addMessageListener("ConnectionEstablished", message => {
      this.broadcast({
        t: "PeerConnected",
        nickname: message.nickname,
        player_id: message.playerId,
        connection_id: message.connectionId,
      });

      this.send(message.connectionId, {
        t: "Handshake",
        connection_id: message.connectionId,
        version: PLAY_PROTO_VERSION,
        world_id: this.ipc.workerData.worldId,
        player_id: message.playerId,
        world_script_base_url: `${this.ipc.workerData.worldResourcesBaseUrl}/${game.worldId}/`,
      });

      // TODO: create playerconnection entity and put it in game.remote
      const peerInfo = {
        connectionId: message.connectionId,
        nickname: message.nickname,
        playerId: message.playerId,
      };
      this.clients.set(message.connectionId, peerInfo);

      this.send(message.connectionId, {
        t: "PeerListSnapshot",
        peers: [...this.clients.values()].map(p => ({
          nickname: p.nickname,
          connection_id: p.connectionId,
          player_id: p.playerId,
        })),
      });

      game.fire(PeerConnected, peerInfo);
    });

    this.ipc.addMessageListener("ConnectionDropped", message => {
      this.broadcast({
        t: "PeerDisconnected",
        connection_id: message.connectionId,
      });
      const peerInfo = this.clients.get(message.connectionId);
      this.clients.delete(message.connectionId);
      if (peerInfo) game.fire(PeerDisconnected, peerInfo);
    });

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
      get peers(): PeerInfo[] {
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