import { IPCWorker } from "../../worker.ts";
import { getWorldPath } from "../../config.ts";
import * as log from "../../util/log.ts";
import * as path from "@std/path";
import { RunningInstance } from "../mod.ts";
import { APP_CONFIG } from "../../config.ts";

export interface PlayerConnection {
  id: string;
  socket: WebSocket;
}

export class GameRuntimeInstance {
  parent: RunningInstance;
  ipc: IPCWorker;

  connections: Map<string, PlayerConnection>;
  // TODO: create common interface for instance rich status
  // deno-lint-ignore no-explicit-any
  richStatus: any;

  startedAt: Date | undefined;

  #ready: boolean;
  #readyPromise: Promise<void>;

  constructor(parent: RunningInstance) {
    this.parent = parent;
    this.connections = new Map();
    this.richStatus = {};

    // const worldPath = getWorldPath(parent.worldId, parent.worldVariant);

    const config = APP_CONFIG;
    const addr = config.bindAddress;
    const workerId = crypto.randomUUID();
    log.debug(`Starting worker for instance '${parent.instanceId}' ...`);
    this.ipc = new IPCWorker(
      {
        workerId,
        workerConnectUrl: `ws://${addr.hostname}:${addr.port}/internal/worker`,
        instanceId: parent.instanceId,
        worldId: parent.worldId,
        worldResourcesBaseUrl: `${parent.urlBase ?? config.publicUrl}/worlds`,
        worldDirectory: path.join(Deno.cwd(), "worlds", parent.worldId, "_dist"),
        debugMode: parent.debugMode,
        // TODO: edit mode
      },
      parent.logs,
    );

    this.startedAt = new Date();

    this.#ready = false;
    this.#readyPromise = new Promise(resolve => {
      this.ipc.addMessageListener("WorkerUp", () => {
        this.#ready = true;
        resolve();
        log.debug(`instance runtime worker ready: ${parent.instanceId}`);
      });
    });

    // TODO: handle status
    this.#handlePackets();
  }

  async ready() {
    if (this.#ready) return;
    await this.#readyPromise;
  }

  shutdown() {
    this.ipc.destroy();
    for (const connection of this.connections.values()) {
      connection.socket.close();
    }

    // clean up worlds in play mode
    if (
      this.parent.worldVariant !== "main" &&
      !this.parent.editMode &&
      !this.parent.worldId.startsWith("dreamlab/")
    ) {
      const worldPath = getWorldPath(this.parent.worldId, this.parent.worldVariant);
      const worldDir = path.join(Deno.cwd(), "runtime", "worlds", worldPath);
      void Deno.remove(worldDir, {
        recursive: true,
      }).catch(err =>
        log.warn("Encountered an error while cleaning up world folder", {
          instance: this.parent.instanceId,
          err,
        }),
      );
    }
  }

  #handlePackets() {
    const sendPacket = (connectionId: string | null, packet: unknown) => {
      const packetJSON = JSON.stringify(packet);

      if (connectionId === null) {
        // broadcast when connectionId is null
        for (const connection of this.connections.values()) {
          sendToConnection(connection, packetJSON);
        }
      } else {
        const connection = this.connections.get(connectionId);
        if (connection === undefined) return;
        sendToConnection(connection, packetJSON);
      }
    };

    this.ipc.addMessageListener("OutgoingPacket", message => {
      sendPacket(message.to, message.packet);
    });
  }
}

function sendToConnection(connection: PlayerConnection, data: string) {
  try {
    connection.socket.send(data);
  } catch (err) {
    log.warn("Failed to send packet to connection", {
      conn: connection.id,
      err,
    });
  }
}
