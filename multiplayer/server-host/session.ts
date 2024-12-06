import { ConnectionId } from "@dreamlab/engine";
import { PlayCodec } from "@dreamlab/proto/codecs/mod.ts";
import { ServerPacket } from "@dreamlab/proto/play.ts";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { CONFIG } from "./config.ts";
import { dumpSceneDefinition, GameInstance } from "./instance.ts";
import { IPCWorker } from "./worker.ts";

import * as path from "jsr:@std/path@1";
import type { RichGameStatus } from "../server-common/rich-status.ts";

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

  startedAt = new Date();

  #autoSaveInterval: ReturnType<typeof setInterval> | undefined;
  #autoSaveTimeout: number | undefined;

  constructor(
    public parent: GameInstance,
    opts: GameSessionOpts = {
      editMode: parent.info.editMode ?? false,
      worldSubDirectory: "_dist",
    },
  ) {
    const addr = CONFIG.bindAddress;
    this.ipc = new IPCWorker(
      {
        workerId: generateCUID("wrk"),
        workerConnectUrl: `ws://${addr.hostname}:${addr.port}/internal/worker`,
        instanceId: parent.info.instanceId,
        worldId: parent.info.worldId,
        worldDirectory: path.join(parent.info.worldDirectory, opts.worldSubDirectory),
        worldResourcesBaseUrl: `${CONFIG.publicUrlBase}/worlds`,
        worldSubdirectory: opts.worldSubDirectory,
        editMode: opts.editMode,
        kvUrl: CONFIG.kvUrl,
        kvSigningKey: CONFIG.kvSigningKey,
        inspect: parent.info.inspect,
      },
      parent.logs,
    );

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

    this.ipc.addMessageListener("ReportRichStatus", message => {
      this.richStatus = message.status;
    });

    this.ipc.addMessageListener("PauseChanged", message => {
      this.paused = message.paused;
    });

    this.ipc.addMessageListener("RequestAutoSave", () => {
      this.triggerAutoSave();
    });
  }

  triggerAutoSave() {
    if (!this.parent.info.editMode) return;

    if (this.#autoSaveTimeout !== undefined) {
      clearTimeout(this.#autoSaveTimeout);
    }

    this.#autoSaveTimeout = setTimeout(async () => {
      this.#autoSaveTimeout = undefined;
      await this.#save();
    }, 3000);
  }

  async #save() {
    try {
      const scene = await dumpSceneDefinition(this.parent);
      const projectJsonFile = path.join(this.parent.info.worldDirectory, "project.json");
      const projectDesc = JSON.parse(await Deno.readTextFile(projectJsonFile));
      projectDesc.scenes = { ...(projectDesc.scenes ?? {}), main: scene };
      await Deno.writeTextFile(projectJsonFile, JSON.stringify(projectDesc, undefined, 2));
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
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

  shutdown() {
    this.ipc.destroy();
    for (const connection of this.connections.values()) {
      connection.socket.close(1001);
    }
    this.connections.clear();

    if (this.#autoSaveInterval) clearInterval(this.#autoSaveInterval);
  }
}
