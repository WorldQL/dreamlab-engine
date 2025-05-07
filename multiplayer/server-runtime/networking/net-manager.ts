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
import { handleIncomingEntityUpdates } from "./entity-sync-rx.ts";
import { handlePing } from "./ping.ts";

export type ServerPacketHandler<T extends ClientPacket["t"] = ClientPacket["t"]> = (
  from: ConnectionId,
  packet: PlayPacket<T, "client">,
) => void;
export type ServerNetworkSetupRoutine = (net: ServerNetworkManager, game: ServerGame) => void;

const LOG_PACKETS = false;
const LOG_EXCLUDE_PACKETS: PlayPacket["t"][] = [
  "ReportEntityTransforms",
  "Ping",
  "CustomMessage",
];

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

  #playSessionState: { running: boolean; paused: boolean } | undefined;

  deleteIgnoreSet = new Set<string>();
  reparentIgnoreSet = new Set<string>();
  renameIgnoreSet = new Set<string>();
  transformIgnoreSet = new Set<string>();

  constructor(private ipc: IPCMessageBus) {}

  setup(game: ServerGame) {
    this.ipc.addMessageListener("IncomingPacket", message => {
      const sender = message.from;
      const packet = message.packet;
      const handlers = this.getPacketHandlers(packet.t);
      for (const handler of handlers) {
        try {
          handler(sender, packet);
        } catch (err) {
          console.warn(`Uncaught error while handling packet of type '${packet.t}'`);
          console.warn(err.stack);
        }
      }

      if (LOG_PACKETS && !LOG_EXCLUDE_PACKETS.includes(packet.t))
        console.log("[<-] " + packet.t);
    });

    const editMode = this.ipc.workerData.editMode;
    if (editMode) {
      this.ipc.addMessageListener("PlaySessionState", message => {
        this.#playSessionState = { paused: message.paused, running: message.running };
        this.broadcast({
          t: "CustomMessage",
          channel: "edit:play-session",
          data: this.#playSessionState,
        });
      });

      this.customMessageListeners.push((from, channel, _data) => {
        if (channel !== "edit:play-session") return;
        if (!this.#playSessionState) return;

        this.send(from, {
          t: "CustomMessage",
          channel: "edit:play-session",
          data: this.#playSessionState,
        });
      });
    }

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
        peers: this.clients
          .values()
          .map(p => ({
            nickname: p.nickname,
            connection_id: p.id,
            player_id: p.playerId,
          }))
          .toArray(),
      });

      game.fire(PlayerConnectionEstablished, peerInfo);

      this.updateRichStatus();
    });

    this.ipc.addMessageListener("ConnectionDropped", message => {
      this.broadcast({
        t: "PeerDisconnected",
        connection_id: message.connectionId,
      });
      const peerInfo = this.clients.get(message.connectionId);
      this.clients.delete(message.connectionId);
      if (peerInfo) game.fire(PlayerConnectionDropped, peerInfo);

      this.updateRichStatus();
    });

    // TODO: handle a bunch of packets
    handleCustomMessages(this, game);
    handlePing(this, game);
    handleIncomingEntityUpdates(this, game);
  }

  updateRichStatus() {
    this.ipc.send({
      op: "ReportRichStatus",
      status: {
        player_count: this.clients.size,
        players: this.clients
          .values()
          .map(({ id, nickname }) => ({ id, nickname }))
          .toArray(),
      },
    });
  }

  send(to: ConnectionId, packet: ServerPacket) {
    if (to === undefined) return;

    if (LOG_PACKETS && !LOG_EXCLUDE_PACKETS.includes(packet.t)) console.log("[->] " + packet.t);
    this.ipc.send({ op: "OutgoingPacket", to, packet });
  }

  broadcast(packet: ServerPacket) {
    if (LOG_PACKETS && !LOG_EXCLUDE_PACKETS.includes(packet.t)) console.log("[->] " + packet.t);
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
