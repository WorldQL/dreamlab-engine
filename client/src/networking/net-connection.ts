import {
  ClientGame,
  ClientNetworking,
  ConnectionId,
  ConnectionInfo,
  CustomMessageData,
  CustomMessageListener,
} from "@dreamlab/engine";
import { PlayCodec } from "@dreamlab/proto/codecs/mod.ts";
import { ClientPacket, PlayPacket, ServerPacket } from "@dreamlab/proto/play.ts";
import { handleCustomMessages } from "./custom-messages.ts";
import { handleProtractedEntitySpawnOperations } from "./entity-spawn-op-rx.ts";
import { handleIncomingEntityUpdates } from "./entity-sync-rx.ts";
import { handleOutgoingEntityUpdates } from "./entity-sync-tx.ts";
import { handlePing } from "./ping.ts";
import { handlePlayerJoins } from "./player-joins.ts";

export type ClientPacketHandler<T extends ServerPacket["t"] = ServerPacket["t"]> = (
  packet: PlayPacket<T, "server">,
) => void;
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

  peers = new Map<ConnectionId, ConnectionInfo>();

  ping: number = 0;
  pingInterval: number | undefined;

  // entity ref ignore sets (need to share between entity sync tx and rx)
  deleteIgnoreSet = new Set<string>();
  reparentIgnoreSet = new Set<string>();
  renameIgnoreSet = new Set<string>();
  transformIgnoreSet = new Set<string>();

  constructor(
    public id: ConnectionId,
    public socket: WebSocket,
    public codec: PlayCodec,
  ) {}

  #lastPacketTime = -1;
  get lastPacketTime() {
    return this.#lastPacketTime;
  }

  handle(packet: ServerPacket) {
    this.#lastPacketTime = Date.now();
    const handlers = this.getPacketHandlers(packet.t);
    for (const handler of handlers) {
      try {
        handler(packet);
      } catch (err) {
        console.warn(`Uncaught error while handling packet of type '${packet.t}': ${err}`);
      }
    }
  }

  setup(game: ClientGame) {
    handlePlayerJoins(this, game);
    handleCustomMessages(this, game);
    handleIncomingEntityUpdates(this, game);
    handleOutgoingEntityUpdates(this, game);
    handleProtractedEntitySpawnOperations(this, game);
    handlePing(this, game);
    // TODO: handle a bunch of packets
  }

  send(packet: ClientPacket) {
    if (this.socket.readyState === this.socket.OPEN) {
      this.socket.send(this.codec.encodePacket(packet));
    }
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
        return conn.peers.values().toArray();
      },
      sendCustomMessage(to: ConnectionId, channel: string, data: CustomMessageData) {
        conn.send({ t: "CustomMessage", channel, data, to: to === "server" ? undefined : to });
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
