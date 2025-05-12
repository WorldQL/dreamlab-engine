import { PlayCodec } from "@dreamlab/proto/codecs/mod.ts";
import { ClientPacketSchema } from "@dreamlab/proto/play.ts";
import { createId } from "@dreamlab/vendor/nanoid.ts";
import * as fs from "@std/fs";
import * as path from "@std/path";

import { LogStore } from "../common-host/log-store.ts";
import { printLogs } from "../common-host/print-logs.ts";
import { IPCWorker } from "../common-host/worker.ts";
import { buildWorld } from "../common-host/world-build.ts";
import { RichGameStatus } from "../server-common/rich-status.ts";
import { reportPlayerCount } from "./actor-reporting.ts";
import { CONFIG } from "./config.ts";

enum InstanceState {
  Idle,
  Starting,
  Running,
  Errored,
}

export class PlayInstance {
  connections = new Map<string, { socket: WebSocket; codec: PlayCodec }>();

  #readyPromise = Promise.withResolvers<void>();
  #ready = false;
  async ready() {
    if (this.#ready) return;
    await this.#readyPromise.promise;
  }

  logs = new LogStore();
  ipc: IPCWorker | undefined;

  constructor(
    public instanceId: string,
    public worldId: string,
  ) {
    printLogs("runtime", this.logs.subscribe());
  }

  async boot() {
    this.setStatus(InstanceState.Starting, "Starting instance");

    const worldsDirectory = CONFIG.WORLDS_DIRECTORY;
    const worldDirectory = path.join(worldsDirectory, this.worldId);
    if (!(await fs.exists(worldDirectory)))
      throw new Error("world does not exist: " + worldDirectory);

    if (!CONFIG.STANDALONE) {
      this.setStatus(InstanceState.Starting, "Building engine");
      await new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", "./pre-exec/prepare-play.ts"],
        stdout: "null",
      }).spawn().status;

      try {
        this.setStatus(InstanceState.Starting, "Building world scripts");
        await buildWorld(this.worldId, worldDirectory, "_dist_play", this.logs);
      } catch (err) {
        this.logs.error("Failed to build world bundle", { err: err.stack });
        this.setStatus(InstanceState.Errored, "World script build failed", err.toString());
        this.#readyPromise.reject();
        return;
      }
    }

    this.setStatus(InstanceState.Starting, "Starting runtime process");
    this.ipc = new IPCWorker(
      {
        workerId: createId("wrk"),
        workerConnectUrl: `ws://${CONFIG.BIND_ADDRESS.hostname}:${CONFIG.BIND_ADDRESS.port}/internal/worker`,

        editMode: false,
        instanceId: this.instanceId,
        worldId: this.worldId,
        worldsDirectory,
        worldDirectory: path.join(worldDirectory, "_dist_play"),

        ...(CONFIG.SCRIPTS_PUBLIC_BASE_URL
          ? {
              worldResourcesBaseUrl: CONFIG.SCRIPTS_PUBLIC_BASE_URL,
              worldResourcesUseSubdirectory: true,
            }
          : {
              worldResourcesBaseUrl: CONFIG.STANDALONE
                ? "/worlds"
                : `${CONFIG.MULTIPLAYER_PUBLIC_URL}/worlds`,
              worldResourcesUseSubdirectory: true,
            }),
        worldSubdirectory: "_dist_play",

        kv:
          CONFIG.KV_PUBLIC_URL && CONFIG.KV_SIGNING_KEY
            ? {
                url: CONFIG.KV_PUBLIC_URL,
                signingKey: CONFIG.KV_SIGNING_KEY,
              }
            : undefined,

        rewriteStackTraces: true,
      },
      this.logs,
      false,
      CONFIG.RUNTIME_SCRIPT,
      CONFIG.STANDALONE ? "deno.json" : undefined,
    );

    this.ipc.addMessageListener("WorkerUp", () => {
      this.#readyPromise.resolve();
      this.#ready = true;
      this.setStatus(InstanceState.Running, "Started");
    });

    this.ipc.addMessageListener("OutgoingPacket", message => {
      if (message.to === null) {
        for (const { socket, codec } of this.connections.values()) {
          try {
            socket.send(codec.encodePacket(message.packet));
          } catch {
            // ignore
          }
        }
      } else {
        const conn = this.connections.get(message.to);
        if (!conn) return;
        conn.socket.send(conn.codec.encodePacket(message.packet));
      }
    });

    this.ipc.addMessageListener("ReportRichStatus", message => {
      this.richStatus = message.status;
    });
  }

  handleConnection(
    connectionId: string,
    socket: WebSocket,
    codec: PlayCodec,
    playerId: string,
    nickname: string,
  ) {
    const ipc = this.ipc;
    if (!ipc) return;

    this.connections.set(connectionId, { socket, codec });
    socket.addEventListener("close", () => {
      ipc.send({ op: "ConnectionDropped", connectionId });
      this.connections.delete(connectionId);
      reportPlayerCount(this);
    });
    socket.addEventListener("message", e => {
      try {
        const packet = ClientPacketSchema.parse(codec.decodePacket(e.data));
        ipc.send({ op: "IncomingPacket", from: connectionId, packet });
      } catch {
        // ignore
      }
    });
    if (socket.readyState === WebSocket.OPEN) {
      ipc.send({ op: "ConnectionEstablished", nickname, playerId, connectionId });
      reportPlayerCount(this);
    } else {
      socket.addEventListener("open", () => {
        ipc.send({ op: "ConnectionEstablished", nickname, playerId, connectionId });
        reportPlayerCount(this);
      });
    }
  }

  #state: InstanceState = InstanceState.Idle;
  #status: string = "Idle";
  #statusDetail: string | undefined;
  richStatus: RichGameStatus | undefined;
  get state() {
    return this.#state;
  }
  get status() {
    return this.#status;
  }
  get statusDetail() {
    return this.#statusDetail;
  }
  setStatus(state: InstanceState, status: string, detail?: string) {
    this.#state = state;
    this.#status = status;
    this.#statusDetail = detail;
    this.logs.debug("Status updated", { ...{ status }, ...(detail ? { detail } : {}) });
  }
}
