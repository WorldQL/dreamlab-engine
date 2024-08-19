import {
  ClientGame,
  ClientNetworking,
  ConnectionId,
  ConnectionInfo,
  CustomMessageData,
  CustomMessageListener,
  PlayerJoined,
  PlayerLeft,
} from "@dreamlab/engine";
import { PlayCodec } from "@dreamlab/proto/codecs/mod.ts";
import {
  PlayerConnectionDropped,
  PlayerConnectionEstablished,
} from "@dreamlab/proto/common/signals.ts";
import { ClientPacket, PlayPacket, ServerPacket } from "@dreamlab/proto/play.ts";
import { handleCustomMessages } from "./custom-messages.ts";
import { handleEntitySync } from "./entity-sync.ts";
import { handlePing } from "./ping.ts";
import { handleTransformSync } from "./transform-sync.ts";
import { handleValueChanges } from "./value-changes.ts";

export type ClientPacketHandler<T extends ServerPacket["t"] = ServerPacket["t"]> = (
  packet: PlayPacket<T, "server">,
) => Promise<void> | void;
export type ClientNetworkSetupRoutine = (conn: ClientConnection, game: ClientGame) => void;

export class ClientConnection {
  customMessageListeners: CustomMessageListener[] = [];

  #packetHandlers = new Map<ServerPacket["t"], ClientPacketHandler[]>();
  registerPacketHandler<T extends ServerPacket["t"]>(t: T, handler: ClientPacketHandler<T>) {
    if (!this.#packetHandlers.has(t)) this.#packetHandlers.set(t, []);
    const handlers = this.#packetHandlers.get(t)!;
    handlers.push(handler as ClientPacketHandler);
  }
  getPacketHandlers<T extends ServerPacket["t"]>(t: T): ClientPacketHandler<T>[] {
    const handlers = this.#packetHandlers.get(t);
    if (!handlers) return [];
    return handlers as ClientPacketHandler<T>[];
  }

  #queue: { packets: ServerPacket[]; processing: boolean } = { packets: [], processing: false };
  async #flushPacketQueue() {
    if (this.#queue.processing) return;
    this.#queue.processing = true;
    while (true) {
      const packets = this.#queue.packets;
      this.#queue.packets = [];
      if (packets.length === 0) break;
      for (const packet of packets) {
        console.log("[<-] " + packet.t);

        const handlers = this.getPacketHandlers(packet.t);
        for (const handler of handlers) {
          try {
            await handler(packet);
          } catch (err) {
            console.warn(`Uncaught error while handling packet of type '${packet.t}': ${err}`);
          }
        }
      }
    }
    this.#queue.processing = false;
  }

  peers = new Map<ConnectionId, ConnectionInfo>();

  ping: number = 0;
  pingInterval: number | undefined;

  constructor(
    public id: ConnectionId,
    public socket: WebSocket,
    public codec: PlayCodec,
  ) {}

  handle(packet: ServerPacket) {
    this.#queue.packets.push(packet);
    void this.#flushPacketQueue();
  }

  setup(game: ClientGame) {
    this.registerPacketHandler("PeerListSnapshot", packet => {
      this.peers.clear();
      for (const peer of packet.peers) {
        this.peers.set(peer.connection_id, {
          id: peer.connection_id,
          nickname: peer.nickname,
          playerId: peer.player_id,
        });
      }
    });
    this.registerPacketHandler("PeerConnected", packet => {
      const peerInfo = {
        id: packet.connection_id,
        nickname: packet.nickname,
        playerId: packet.player_id,
      };
      this.peers.set(packet.connection_id, peerInfo);
      game.fire(PlayerConnectionEstablished, peerInfo);
    });
    this.registerPacketHandler("PeerDisconnected", packet => {
      const peerInfo = this.peers.get(packet.connection_id);
      this.peers.delete(packet.connection_id);
      if (peerInfo) {
        game.fire(PlayerConnectionDropped, peerInfo);
        game.fire(PlayerLeft, peerInfo);
      }
    });
    this.registerPacketHandler("PlayerJoined", packet => {
      const peerInfo = this.peers.get(packet.connection_id);
      if (peerInfo) game.fire(PlayerJoined, peerInfo);
    });
    this.registerPacketHandler("PeerChangedNickname", packet => {
      const peer = this.peers.get(packet.connection_id);
      if (!peer) return;
      peer.nickname = packet.new_nickname;
    });

    handlePing(this, game);
    handleValueChanges(this, game);
    handleCustomMessages(this, game);
    handleEntitySync(this, game);
    handleTransformSync(this, game);

    // get an initial ping
    setTimeout(() => {
      this.send({ t: "Ping", type: "ping", timestamp: Date.now() });
    }, 1000);
    // send pings every second
    this.pingInterval = setInterval(() => {
      this.send({ t: "Ping", type: "ping", timestamp: Date.now() });
    }, 1000);
  }

  send(packet: ClientPacket) {
    this.socket.send(this.codec.encodePacket(packet));
  }

  createNetworking(): ClientNetworking {
    // deno-lint-ignore no-this-alias
    const conn = this;

    return {
      get ping() {
        return conn.ping;
      },
      get self() {
        return conn.id;
      },
      get connections(): ConnectionInfo[] {
        return [...conn.peers.values()];
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
      disconnect() {
        if (conn.pingInterval) clearInterval(conn.pingInterval);
        conn.socket.close();
        // do we want to clear listeners here?
      },
    };
  }
}
