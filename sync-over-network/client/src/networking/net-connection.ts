import { ClientPacket, PlayPacket, ServerPacket } from "@dreamlab/proto/play.ts";
import { PlayCodec } from "@dreamlab/proto/codecs/mod.ts";
import {
  ClientGame,
  ClientNetworking,
  ConnectionId,
  CustomMessageData,
  CustomMessageListener,
} from "@dreamlab/engine";
import { handleSyncedValues } from "./synced-values.ts";
import { handleCustomMessages } from "./custom-messages.ts";
import { handleEntitySync } from "./entity-sync.ts";
import { handleTransformSync } from "./transform-sync.ts";

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

  peers = new Map<
    ConnectionId,
    { connectionId: ConnectionId; playerId: string; nickname: string }
  >();

  constructor(
    public id: ConnectionId,
    public socket: WebSocket,
    public codec: PlayCodec,
  ) {}

  handle(packet: ServerPacket) {
    console.log(`[<-] ${packet.t}`);

    try {
      this.getPacketHandler(packet.t)(packet);
    } catch (err) {
      console.warn(`Uncaught error while handling packet of type '${packet.t}': ${err}`);
    }
  }

  setup(game: ClientGame) {
    this.registerPacketHandler("PeerConnected", packet => {
      this.peers.set(packet.connection_id, {
        connectionId: packet.connection_id,
        nickname: packet.nickname,
        playerId: packet.player_id,
      });
    });
    this.registerPacketHandler("PeerDisconnected", packet => {
      this.peers.delete(packet.connection_id);
    });
    this.registerPacketHandler("PeerChangedNickname", packet => {
      const peer = this.peers.get(packet.connection_id);
      if (!peer) return;
      peer.nickname = packet.new_nickname;
    });

    handleSyncedValues(this, game);
    handleCustomMessages(this, game);
    handleEntitySync(this, game);
    handleTransformSync(this, game);
  }

  send(packet: ClientPacket) {
    console.log(`[->] ${packet.t}`);

    this.socket.send(this.codec.encodePacket(packet));
  }

  createNetworking(): ClientNetworking {
    // deno-lint-ignore no-this-alias
    const conn = this;

    return {
      get connectionId() {
        return conn.id;
      },
      get peers(): ConnectionId[] {
        return [...conn.peers.values()].map(p => p.connectionId);
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
