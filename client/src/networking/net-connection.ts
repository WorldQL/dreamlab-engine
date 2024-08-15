import { ClientPacket, PlayPacket, ServerPacket } from "@dreamlab/proto/play.ts";
import { PlayCodec } from "@dreamlab/proto/codecs/mod.ts";
import {
  ClientGame,
  ClientNetworking,
  ConnectionId,
  CustomMessageData,
  CustomMessageListener,
  ConnectionInfo,
  PlayerLeft,
  PlayerJoined,
} from "@dreamlab/engine";
import { handleValueChanges } from "./value-changes.ts";
import { handleCustomMessages } from "./custom-messages.ts";
import { handleEntitySync } from "./entity-sync.ts";
import { handleTransformSync } from "./transform-sync.ts";
import { handlePing } from "./ping.ts";
import {
  PlayerConnectionEstablished,
  PlayerConnectionDropped,
} from "@dreamlab/proto/common/signals.ts";

export type ClientPacketHandler<T extends ServerPacket["t"]> = (
  packet: PlayPacket<T, "server">,
) => void;
export type ClientNetworkSetupRoutine = (conn: ClientConnection, game: ClientGame) => void;

export class ClientConnection {
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

  peers = new Map<ConnectionId, ConnectionInfo>();

  ping: number = 0;
  pingInterval: number | undefined;

  constructor(
    public id: ConnectionId,
    public socket: WebSocket,
    public codec: PlayCodec,
  ) {}

  handle(packet: ServerPacket) {
    try {
      this.getPacketHandler(packet.t)(packet);
    } catch (err) {
      console.warn(`Uncaught error while handling packet of type '${packet.t}': ${err}`);
    }
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
    // send pings every 10 seconds
    this.pingInterval = setInterval(() => {
      this.send({ t: "Ping", type: "ping", timestamp: Date.now() });
    }, 1000 * 10);
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
