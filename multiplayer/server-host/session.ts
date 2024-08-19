import { ConnectionId } from "@dreamlab/engine";
import { PlayCodec } from "@dreamlab/proto/codecs/mod.ts";
import { ServerPacket } from "@dreamlab/proto/play.ts";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { CONFIG } from "./config.ts";
import { GameInstance } from "./instance.ts";
import { IPCWorker } from "./worker.ts";

import * as path from "jsr:@std/path@1";

interface ConnectedClient {
  connectionId: string;
  socket: WebSocket;
  codec: PlayCodec;
}

export interface GameSessionOpts {
  editMode: boolean;
  worldSubDirectory: string;
}

export class GameSession {
  ipc: IPCWorker;

  connections = new Map<string, ConnectedClient>();

  status: object = {};

  #readied: boolean = false;
  #readyPromise: Promise<void>;
  #readyPromiseResolve: (() => void) | undefined;

  startedAt = new Date();

  constructor(
    public parent: GameInstance,
    opts: GameSessionOpts = {
      editMode: parent.info.editMode ?? false,
      worldSubDirectory: "_dist",
    },
  ) {
    const addr = CONFIG.bindAddress;
    this.ipc = new IPCWorker({
      workerId: generateCUID("wrk"),
      workerConnectUrl: `ws://${addr.hostname}:${addr.port}/internal/worker`,
      instanceId: parent.info.instanceId,
      worldId: parent.info.worldId,
      worldDirectory: path.join(parent.info.worldDirectory, opts.worldSubDirectory),
      worldResourcesBaseUrl: `${CONFIG.publicUrlBase}/worlds`,
      worldSubdirectory: opts.worldSubDirectory,
      editMode: opts.editMode,
    });

    this.#readyPromise = new Promise((resolve, _reject) => {
      this.#readyPromiseResolve = resolve;
    });

    this.ipc.addMessageListener("WorkerUp", _message => {
      this.#readyPromiseResolve?.();
      this.#readied = true;
    });

    this.ipc.addMessageListener("OutgoingPacket", message => {
      if (message.to === null) {
        this.broadcastPacket(message.packet);
        return;
      }

      this.sendPacket(message.to, message.packet);
    });

    this.ipc.addMessageListener("SetStatus", message => {
      this.status = message.status;
    });
  }

  broadcastPacket(packet: ServerPacket) {
    for (const connection of this.connections.values()) {
      const packetData = connection.codec.encodePacket(packet);
      connection.socket.send(packetData);
    }
  }

  sendPacket(to: ConnectionId, packet: ServerPacket) {
    const connection = this.connections.get(to);
    if (connection === undefined) return;
    const packetData = connection.codec.encodePacket(packet);
    connection.socket.send(packetData);
  }

  async ready() {
    if (this.#readied) return;
    await this.#readyPromise;
  }

  shutdown() {
    this.ipc.destroy();
  }
}
