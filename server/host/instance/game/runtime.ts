import { IPCWorker } from "../../worker.ts";
import { getWorldPath } from "../../config.ts";
import * as log from "../../util/log.ts";
import * as path from "@std/path";
import { RunningInstance } from "../mod.ts";
import { createKv } from "../../kv.ts";
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

  constructor(parent: RunningInstance, tempDir: string) {
    this.parent = parent;
    this.connections = new Map();
    this.richStatus = {};

    const worldPath = getWorldPath(parent.worldId, parent.worldVariant);

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
        worldVariant: parent.worldVariant,
        worldScriptURLBase: `${parent.urlBase ?? config.publicUrl}/worlds/${worldPath}`,
        editMode: parent.editMode,
        tempDir,
        debugMode: parent.debugMode,
      },
      path.join(Deno.cwd(), "runtime", "worlds", worldPath),
      parent.logs,
    );

    this.startedAt = new Date();

    createKv(this.ipc);

    this.#ready = false;
    this.#readyPromise = new Promise(resolve => {
      this.ipc.addMessageListener("WorkerUp", () => {
        this.#ready = true;
        resolve();
        log.debug(`instance runtime worker ready: ${parent.instanceId}`);
      });
    });

    this.#handleStatus();
    this.#handlePackets();
    this.#handleLogging();

    this.ipc.addMessageListener("TracerBatchExport", async message => {
      if (path.relative(tempDir, message.path).startsWith("..")) return;

      const buffer = await Deno.readFile(message.path);
      await Deno.remove(message.path);

      // const compactTraces = cbor.decodeMultiple(buffer)![0]
      // const _traces = expandTraceSpans(compactTraces as CompactTraceSpan[])

      // TODO: process traces
    });
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

  #handleStatus() {
    let hadPlayers = false;

    this.ipc.addMessageListener("SetStatus", message => {
      this.richStatus = message.status;

      hadPlayers ||= message.status?.player_count > 0;
      if (this.parent.closeOnEmpty) {
        if (hadPlayers && message.status.player_count === 0) {
          this.parent.shutdown();
        }
      }
    });
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
      sendPacket(message.connectionId, message.packet);
    });

    this.ipc.addMessageListener("MultiOutgoingPackets", message => {
      for (const [connectionId, packet] of message.packets) {
        sendPacket(connectionId, packet);
      }
    });
  }

  #handleLogging() {
    this.ipc.addMessageListener("LogMessage", message => {
      this.parent.logs.publish({
        timestamp: Date.now(),
        detail: message.detail,
        level: message.level,
        message: message.message,
      });
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
