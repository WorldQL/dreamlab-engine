import { CONFIG } from "./config.ts";
import { IPCWorker } from "./worker.ts";
import { PlayCodec } from "@dreamlab/proto/codecs/mod.ts";

export interface InstanceInfo {
  instanceId: string;
  worldId: string;
  worldDirectory: string;
}

interface ConnectedClient {
  connectionId: string;
  socket: WebSocket;
  codec: PlayCodec;
}

export class GameInstance {
  ipc: IPCWorker;

  static INSTANCES = new Map<string, GameInstance>();

  connections = new Map<string, ConnectedClient>();

  status: object = {};

  #readied: boolean = false;
  #readyPromise: Promise<void>;
  #readyPromiseResolve: (() => void) | undefined;

  constructor(public info: InstanceInfo) {
    const addr = CONFIG.bindAddress;
    this.ipc = new IPCWorker(
      {
        workerId: crypto.randomUUID(),
        workerConnectUrl: `ws://${addr.hostname}:${addr.port}/internal/worker`,
        instanceId: info.instanceId,
        worldId: info.worldId,
      },
      info.worldDirectory,
    );

    this.#readyPromise = new Promise((resolve, _reject) => {
      this.#readyPromiseResolve = resolve;
    });

    this.ipc.addMessageListener("WorkerUp", _message => {
      this.#readyPromiseResolve?.();
      this.#readied = true;
    });

    this.ipc.addMessageListener("OutgoingPacket", message => {
      console.log(`[->] ${message.packet.t} ${message.to}`);

      if (message.to === null) {
        for (const connection of this.connections.values()) {
          const packetData = connection.codec.encodePacket(message.packet);
          connection.socket.send(packetData);
        }
        return;
      }

      const connection = this.connections.get(message.to);
      if (connection === undefined) return;
      const packetData = connection.codec.encodePacket(message.packet);
      connection.socket.send(packetData);
    });

    this.ipc.addMessageListener("SetStatus", message => {
      this.status = message.status;
    });
  }

  async ready() {
    if (this.#readied) return;
    await this.#readyPromise;
  }

  shutdown() {
    this.ipc.destroy();
  }
}
