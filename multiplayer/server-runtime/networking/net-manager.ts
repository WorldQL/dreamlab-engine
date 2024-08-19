import {
  ConnectionId,
  ConnectionInfo,
  CustomMessageData,
  CustomMessageListener,
  ServerGame,
  ServerNetworking,
} from "@dreamlab/engine";
import {
  PlayerConnectionDropped,
  PlayerConnectionEstablished,
} from "@dreamlab/proto/common/signals.ts";
import {
  ClientPacket,
  PLAY_PROTO_VERSION,
  PlayPacket,
  ServerPacket,
} from "@dreamlab/proto/play.ts";
import { IPCMessageBus } from "../ipc.ts";
import { handleCustomMessages } from "./custom-messages.ts";
import { handleEntitySync } from "./entity-sync.ts";
import { handlePing } from "./ping.ts";
import { handlePlayerJoinExchange } from "./player-join-states.ts";
import { handleTransformSync } from "./transform-sync.ts";
import { handleValueChanges } from "./value-changes.ts";

export type ServerPacketHandler<T extends ClientPacket["t"] = ClientPacket["t"]> = (
  from: ConnectionId,
  packet: PlayPacket<T, "client">,
) => Promise<void> | void;
export type ServerNetworkSetupRoutine = (net: ServerNetworkManager, game: ServerGame) => void;

type ClientPacketQueue = { packets: ClientPacket[]; processing: boolean };

export class ServerNetworkManager {
  clients = new Map<ConnectionId, ConnectionInfo>();

  customMessageListeners: CustomMessageListener[] = [];

  #packetHandlers = new Map<ClientPacket["t"], ServerPacketHandler[]>();
  registerPacketHandler<T extends ClientPacket["t"]>(t: T, handler: ServerPacketHandler<T>) {
    if (!this.#packetHandlers.has(t)) this.#packetHandlers.set(t, []);
    const handlers = this.#packetHandlers.get(t)!;
    handlers.push(handler as ServerPacketHandler);
  }
  getPacketHandlers<T extends ClientPacket["t"]>(t: T): ServerPacketHandler<T>[] {
    const handlers = this.#packetHandlers.get(t);
    if (!handlers) return [];
    return handlers as ServerPacketHandler<T>[];
  }

  #packetQueues = new Map<ConnectionId, ClientPacketQueue>();
  #getPacketQueue(connection: ConnectionId) {
    let packetQueue = this.#packetQueues.get(connection);
    if (!packetQueue) {
      packetQueue = { packets: [], processing: false };
      this.#packetQueues.set(connection, packetQueue);
    }
    return packetQueue;
  }
  async #flushPacketQueue(connection: ConnectionId, queue: ClientPacketQueue) {
    if (queue.processing) return;
    queue.processing = true;
    while (true) {
      const packets = queue.packets;
      queue.packets = [];
      if (packets.length === 0) break;
      for (const packet of packets) {
        const handlers = this.getPacketHandlers(packet.t);
        for (const handler of handlers) {
          try {
            await handler(connection, packet);
          } catch (err) {
            console.warn(`Uncaught error while handling packet of type '${packet.t}': ${err}`);
          }
        }
      }
    }
    queue.processing = false;
  }

  constructor(private ipc: IPCMessageBus) {}

  setup(game: ServerGame) {
    this.ipc.addMessageListener("IncomingPacket", message => {
      // if (message.packet.t !== "Ping") console.log("[<-] " + message.packet.t);

      const sender = message.from;
      const packetQueue = this.#getPacketQueue(message.packet.t);
      packetQueue.packets.push(message.packet);
      void this.#flushPacketQueue(sender, packetQueue);
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
        world_script_base_url: `${this.ipc.workerData.worldResourcesBaseUrl}/${game.worldId}/${this.ipc.workerData.worldSubdirectory}/`,
        edit_mode: this.ipc.workerData.editMode,
      });

      // TODO: create playerconnection entity and put it in game.remote
      const peerInfo = {
        id: message.connectionId,
        nickname: message.nickname,
        playerId: message.playerId,
      };
      this.clients.set(message.connectionId, peerInfo);

      this.send(message.connectionId, {
        t: "PeerListSnapshot",
        peers: [...this.clients.values()].map(p => ({
          nickname: p.nickname,
          connection_id: p.id,
          player_id: p.playerId,
        })),
      });

      game.fire(PlayerConnectionEstablished, peerInfo);
    });

    this.ipc.addMessageListener("ConnectionDropped", message => {
      this.broadcast({
        t: "PeerDisconnected",
        connection_id: message.connectionId,
      });
      const peerInfo = this.clients.get(message.connectionId);
      this.clients.delete(message.connectionId);
      if (peerInfo) game.fire(PlayerConnectionDropped, peerInfo);
    });

    handlePing(this, game);
    handlePlayerJoinExchange(this, game);
    handleValueChanges(this, game);
    handleCustomMessages(this, game);
    handleEntitySync(this, game);
    handleTransformSync(this, game);
  }

  send(to: ConnectionId, packet: ServerPacket) {
    if (to === undefined) return;
    // if (packet.t !== "Ping") console.log("[->] " + packet.t);
    this.ipc.send({ op: "OutgoingPacket", to, packet });
  }

  broadcast(packet: ServerPacket) {
    // if (packet.t !== "Ping") console.log("[->] " + packet.t);
    this.ipc.send({ op: "OutgoingPacket", to: null, packet });
  }

  createNetworking(): ServerNetworking {
    // deno-lint-ignore no-this-alias
    const net = this;

    return {
      get self(): ConnectionId {
        return "server";
      },
      get connections(): ConnectionInfo[] {
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
      disconnect() {
        // TODO: uhhhh
      },
    };
  }
}
