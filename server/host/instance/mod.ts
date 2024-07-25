import * as path from "@std/path";
import * as colors from "@std/fmt/colors";
import * as fs from "@std/fs";

import { z } from "zod";

import { buildWorld, fetchWorld } from "./worlds.ts";
import { getWorldPath } from "../config.ts";
import { GameRuntimeInstance } from "./game/runtime.ts";
import { LogStore } from "./log-store.ts";
import { APP_CONFIG } from "../config.ts";

import * as log from "../util/log.ts";

export type InstanceInfo = z.infer<typeof InstanceInfoSchema>;
export const InstanceInfoSchema = z.object({
  id: z.string(),
  server: z.string(),
  world: z.string(),
  status: z.string(),
  status_detail: z.string().nullable(),
  started_by: z.string().nullable(),
  edit_mode: z.boolean(),
  uptime_secs: z.number(),
  rich_status: z.any().optional(), // TODO: properly spec rich status
  started_at: z.number().optional(),
});

export class RunningInstance {
  logs: LogStore = new LogStore();

  readonly instanceId: string;
  readonly serverUrl: string;
  readonly worldId: string;
  readonly worldVariant: string;
  readonly worldRevision: string | undefined;

  readonly createdAt: Date;
  #idleSince: Date;
  get idleSince() {
    return this.#idleSince;
  }

  // TODO: status should probably be an enum (or at least a literal union)
  #status: string = "New";
  #statusDetail: string | undefined;
  get status() {
    return this.#status;
  }
  get statusDetail() {
    return this.#statusDetail;
  }

  game: GameRuntimeInstance | undefined;

  readonly startedBy: string | undefined;
  readonly editMode: boolean;
  readonly debugMode: boolean;
  readonly closeOnEmpty: boolean;
  readonly urlBase: string | undefined;
  readonly originatingInstanceId: string | undefined;
  readonly originatingWorldId: string | undefined;

  #notifyBooted: (() => void) | undefined;
  // deno-lint-ignore no-explicit-any
  #notifyBootFail: ((reason?: any) => void) | undefined;
  #bootedPromise: Promise<unknown> | undefined;
  #booting = false;

  /** @see {createInstance} */
  constructor(
    instanceId: string,
    serverUrl: string,
    worldId: string,
    worldVariant: string,
    worldRevision: string | undefined,
    startedBy: string | undefined,
    editMode: boolean,
    debugMode: boolean,
    closeOnEmpty: boolean,
    urlBase: string | undefined,
    originatingInstanceId: string | undefined,
    originatingWorldId: string | undefined,
  ) {
    this.instanceId = instanceId;
    this.serverUrl = serverUrl;
    this.worldId = worldId;
    this.worldVariant = worldVariant;
    this.worldRevision = worldRevision;

    this.createdAt = new Date();
    this.#idleSince = this.createdAt;

    this.startedBy = startedBy;
    this.editMode = editMode;
    this.debugMode = debugMode;
    this.closeOnEmpty = closeOnEmpty;
    this.urlBase = urlBase;
    this.originatingInstanceId = originatingInstanceId;
    this.originatingWorldId = originatingWorldId;

    this.resetBooted();

    this.#printLogs();
  }

  async booted() {
    if (!this.#booting) return;
    const err = await this.#bootedPromise;
    if (err) throw err;
  }

  notifyBooted() {
    if (!this.#booting) return;
    this.#notifyBooted?.();
    this.#booting = false;
  }

  // deno-lint-ignore no-explicit-any
  notifyBootFail(reason?: any) {
    if (!this.#booting) return;
    this.#notifyBootFail?.(reason);
    this.#booting = false;
  }

  resetBooted() {
    this.#booting = true;
    this.#bootedPromise = new Promise<void>((resolve, reject) => {
      this.#notifyBooted = resolve;
      this.#notifyBootFail = reject;
    }).catch(e => e);
  }

  info(): InstanceInfo {
    const info: InstanceInfo = {
      id: this.instanceId,
      server: this.serverUrl,
      world: this.worldId,
      status: this.status,
      status_detail: this.statusDetail ?? null,
      started_by: this.startedBy ?? null,
      edit_mode: this.editMode,
      uptime_secs: (Date.now() - this.createdAt.getTime()) / 1000,
    };

    if (this.game !== undefined) {
      info.rich_status = this.game.richStatus;
      info.started_at = this.game.startedAt?.getTime();
    }

    return info;
  }

  shutdown() {
    this.game?.shutdown();
    this.setStatus("Shut down");
  }

  restart() {
    this.setStatus("Restarting");
    this.game?.shutdown();
    bootInstance(this, true);
  }

  setStatus(status: string, detail?: string) {
    this.#status = status;
    this.#statusDetail = detail;
    this.logs.debug("Status updated", { status });
    this.bumpIdleTime();
  }

  bumpIdleTime() {
    this.#idleSince = new Date();
  }

  #printLogs() {
    const shortId = this.instanceId.substring(this.instanceId.length - 8);

    this.logs.subscribe().on(entry => {
      if (entry.level === "stdio") return;

      // TODO: refactor logging system and pass to new logging system
      // so that we have better output of args

      const separator = colors.black("|");
      const workerTag = colors.dim(`[worker …${shortId}]`);
      const levelColor = {
        debug: colors.gray,
        info: colors.green,
        warn: colors.yellow,
        error: colors.red,
      }[entry.level];
      const levelTag = levelColor(`${entry.level}`);

      let logMessage = `${workerTag} ${levelTag} ${separator} ${colors.brightWhite(
        entry.message,
      )}`;
      if (entry.detail !== undefined) {
        logMessage += ` ${separator}`;
        for (const [key, value] of Object.entries(entry.detail)) {
          logMessage += colors.dim(colors.italic(` ${key}`) + "=");
          logMessage += Deno.inspect(value, {
            colors: true,
            compact: true,
            breakLength: Infinity,
            strAbbreviateSize: Infinity,
          });
        }
      }
      console.log(logMessage);
    });
  }
}

export const bootInstance = async (instance: RunningInstance, restart: boolean = false) => {
  instance.setStatus("Restarting world");
  instance.resetBooted();

  const worldDirectory = path.join(
    Deno.cwd(),
    "runtime",
    "worlds",
    getWorldPath(instance.worldId, instance.worldVariant),
  );

  if (instance.worldId.startsWith("dreamlab/")) {
    instance.logs.debug("Skipping world fetch ('dreamlab/' world ID)");
  } else {
    if (instance.editMode && restart) {
      instance.logs.debug("Skipping world fetch (restarting with edit mode enabled)");
    } else if (instance.editMode !== undefined && (await fs.exists(worldDirectory))) {
      instance.logs.debug("Checking git status...");

      try {
        const statusOutput = await new Deno.Command("git", {
          args: ["status", "--porcelain"],
          cwd: worldDirectory,
          stdout: "piped",
          stderr: "piped",
        }).output();

        if (statusOutput.stdout.length > 0) {
          instance.logs.debug(
            "Skipping world fetch (booting edit world with uncommitted changes)",
          );
        } else {
          instance.setStatus("Fetching world");
          await fetchWorld(instance, instance.worldId, worldDirectory);
        }
      } catch (_err) {
        // ignore
      }
    } else {
      instance.setStatus("Fetching world");
      await fetchWorld(instance, instance.worldId, worldDirectory);
    }
  }
  instance.setStatus(restart ? "Rebuilding world" : "Building world");
  try {
    await buildWorld(instance, worldDirectory, {
      discord: instance.worldVariant === "discord",
    });

    instance.setStatus(restart ? "Rebooting" : "Booting");
    const game = new GameRuntimeInstance(instance);
    instance.game = game;
    await game.ready();
    instance.setStatus("Started");
    instance.notifyBooted();
  } catch (err) {
    instance.logs.error(`Failed to build world bundle`, { err: err.stack });
    instance.setStatus("Build failed", err.toString());
    instance.notifyBootFail(err);

    return;
  }
};

interface CreateInstanceOptions {
  startedBy?: string | undefined;
  editMode?: boolean;
  debugMode?: boolean;
  closeOnEmpty?: boolean;
  publicURLBase?: string;
  /**
   * in the case of 'instance derivation' (i.e. world travel),
   * we need to ensure instances in the same 'universe' have the same ID namespace.
   *
   * if we simply derived from the current instance ID and did not store this transitive root,
   * travelling A -> B -> C vs travelling A -> C directly would result in the same world having
   * two different instance IDs for the same party.
   */
  originatingInstanceId?: string;
  originatingWorldId?: string;

  worldRevision?: string;
}

export const createInstance = (
  instanceId: string,
  worldId: string,
  worldVariant: string,
  options: CreateInstanceOptions,
) => {
  const serverUrl = new URL(APP_CONFIG.publicUrl);
  if (serverUrl.protocol === "http:") serverUrl.protocol = "ws:";
  if (serverUrl.protocol === "https:") serverUrl.protocol = "wss:";

  const instance = new RunningInstance(
    instanceId,
    serverUrl.toString(),
    worldId,
    worldVariant,
    options.worldRevision,
    options.startedBy,
    options.editMode ?? false,
    options.debugMode ?? false,
    options.closeOnEmpty ?? false,
    options.publicURLBase,
    options.originatingInstanceId,
    options.originatingWorldId,
  );
  void bootInstance(instance).catch(err => {
    instance.logs.error("An error occurred while booting the instance", {
      err: err.stack,
    });
    instance.setStatus("Failed to start");
  });
  return instance;
};
