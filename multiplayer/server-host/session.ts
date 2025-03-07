import { ConnectionId } from "@dreamlab/engine";
import { PlayCodec } from "@dreamlab/proto/codecs/mod.ts";
import { ServerPacket } from "@dreamlab/proto/play.ts";
import { createId } from "@dreamlab/vendor/nanoid.ts";
import { IPCWorker } from "../common-host/worker.ts";
import { CONFIG } from "./config.ts";
import { dumpSceneDefinition, GameInstance, GameInstanceState } from "./instance.ts";

import * as path from "@std/path";
import pidusage from "npm:pidusage@3.0.2";
import type { RichGameStatus } from "../server-common/rich-status.ts";
import { WorkerInitData } from "../server-common/worker-data.ts";
import { watchForEditChanges } from "./edit-watcher.ts";
import { report, WorkerMetrics } from "./metrics.ts";
import { toMarkdownSceneTree } from "./util/compact-markdown-scene-tree.ts";

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

  richStatus: RichGameStatus = { players: [], player_count: 0 };
  paused: boolean = false;

  #readied: boolean = false;
  #readyPromise: Promise<void>;
  #readyPromiseResolve: (() => void) | undefined;

  #loaded: boolean = false;
  #loadedPromise: Promise<void>;
  #loadedPromiseResolve: (() => void) | undefined;
  #loadedPromiseReject: ((error: Error) => void) | undefined;

  editWatcher: Deno.FsWatcher | undefined;

  startedAt = new Date();

  #autoSaveInterval: ReturnType<typeof setInterval> | undefined;

  constructor(
    public parent: GameInstance,
    opts: GameSessionOpts = {
      editMode: parent.info.editMode ?? false,
      worldSubDirectory: parent.info.variant ? `_dist_${parent.info.variant}` : "_dist",
    },
  ) {
    const addr = CONFIG.BIND_ADDRESS;
    const ipcData: WorkerInitData = {
      workerId: createId("wrk"),
      workerConnectUrl: `ws://${addr.hostname}:${addr.port}/internal/worker`,
      instanceId: parent.info.instanceId,
      worldId: parent.info.worldId,
      worldsDirectory: CONFIG.WORLDS_DIRECTORY,
      worldDirectory: path.join(parent.info.worldDirectory, opts.worldSubDirectory),
      worldResourcesBaseUrl: `${CONFIG.MULTIPLAYER_PUBLIC_URL}/worlds`,
      worldSubdirectory: opts.worldSubDirectory,
      editMode: opts.editMode,
      kv: {
        url: CONFIG.KV_PUBLIC_URL,
        signingKey: CONFIG.KV_SIGNING_KEY,
      },
      inspect: parent.info.inspect,
      rewriteStackTraces: CONFIG.MULTIPLAYER_REWRITE_STACK_TRACES,
    };
    if (parent.info.variant === "discord") {
      const discordURLBase = "https://" + parent.info.discordClientId! + ".discordsays.com";
      ipcData.kv!.clientUrl = discordURLBase + "/.proxy/kv";
      ipcData.worldResourcesBaseUrl = discordURLBase + "/.proxy/mp/worlds";
    }
    this.ipc = new IPCWorker(ipcData, parent.logs, CONFIG.MULTIPLAYER_USE_SYSTEMD_LIMITS);
    const ipc = this.ipc;
    void (async () => {
      const status = await ipc.process.status;

      this.shutdown();
      if (!this.#loaded)
        this.#loadedPromiseReject?.(new Error("instance crashed before load completed"));

      if (status.code === 137 && CONFIG.MULTIPLAYER_USE_SYSTEMD_LIMITS) {
        this.parent.setStatus(
          GameInstanceState.Errored,
          "Instance was forcefully terminated (likely ran out of memory or CPU)",
        );
      }

      if (this === parent.playSession) {
        parent.playSession = undefined;
        parent.sendPlaySessionState();
      }
    })();

    const ready = Promise.withResolvers<void>();
    this.#readyPromise = ready.promise;
    this.#readyPromiseResolve = ready.resolve;

    const loaded = Promise.withResolvers<void>();
    this.#loadedPromise = loaded.promise;
    this.#loadedPromiseResolve = loaded.resolve;
    this.#loadedPromiseReject = loaded.reject;

    this.ipc.addMessageListener("WorkerUp", _message => {
      this.#readyPromiseResolve?.();
      this.#readied = true;
      report(this);
    });

    this.ipc.addMessageListener("GameLoaded", _message => {
      this.#loadedPromiseResolve?.();
      this.#loaded = true;
    });

    this.ipc.addMessageListener("OutgoingPacket", message => {
      if (message.to === null) {
        this.broadcastPacket(message.packet);
        return;
      }

      this.sendPacket(message.to, message.packet);
    });

    this.ipc.addMessageListener("ReportRichStatus", message => {
      this.richStatus = message.status;
    });

    this.ipc.addMessageListener("PauseChanged", message => {
      this.paused = message.paused;
    });

    if (opts.editMode) {
      watchForEditChanges(this, opts.worldSubDirectory);

      const save = async () => {
        try {
          const scene = await dumpSceneDefinition(parent);
          const projectJsonFile = path.join(parent.info.worldDirectory, "project.json");
          const projectDesc = JSON.parse(await Deno.readTextFile(projectJsonFile));
          projectDesc.scenes = { ...(projectDesc.scenes ?? {}), main: scene };

          const markdownScene = toMarkdownSceneTree(scene);
          const markdownSceneFile = path.join(
            parent.info.worldDirectory,
            "scene-description.md",
          );
          await Deno.writeTextFile(markdownSceneFile, markdownScene);
          await Deno.writeTextFile(projectJsonFile, JSON.stringify(projectDesc, undefined, 2));
        } catch (_err) {
          // ignore
        }
      };

      this.#autoSaveInterval = setInterval(save, 5000);
    }
  }

  get lastHeartbeat(): number {
    // milliseconds (Date.now)
    return this.ipc.lastHeartbeat;
  }

  broadcastPacket(packet: ServerPacket) {
    for (const connection of this.connections.values()) {
      const packetData = connection.codec.encodePacket(packet);
      try {
        connection.socket.send(packetData);
      } catch {
        // ignore
      }
    }
  }

  sendPacket(to: ConnectionId, packet: ServerPacket) {
    const connection = this.connections.get(to);
    if (connection === undefined) return;
    const packetData = connection.codec.encodePacket(packet);
    try {
      connection.socket.send(packetData);
    } catch {
      // ignore
    }
  }

  async ready() {
    if (this.#readied) return;
    await this.#readyPromise;
  }

  async loaded() {
    if (this.#loaded) return;
    await this.#loadedPromise;
  }

  #shuttingDown = false;
  wasShutDown = false;
  shutdown() {
    if (this.#shuttingDown) return;
    this.#shuttingDown = true;

    if (this.editWatcher) this.editWatcher.close();

    if (this.parent.info.variant === "play") {
      this.parent.sendPlaySessionState();
    }

    this.ipc.destroy();
    for (const connection of this.connections.values()) {
      connection.socket.close(1001);
    }
    this.connections.clear();

    if (this.#autoSaveInterval) clearInterval(this.#autoSaveInterval);

    this.wasShutDown = true;
  }

  async metrics(): Promise<WorkerMetrics> {
    const { timestamp, cpu, memory } = await pidusage(this.ipc.process.pid);

    return {
      ts: new Date(timestamp),
      cpu,
      memory,
      connections: this.connections.size,
    };
  }
}
