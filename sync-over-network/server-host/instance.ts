import { GameSession } from "./session.ts";
import { LogStore } from "./util/log-store.ts";

import * as colors from "jsr:@std/fmt@1.0.0-rc.1/colors";
import { fetchWorld } from "./world-fetch.ts";
import { bundleWorld } from "../../build-system/mod.ts";

export enum GameInstanceState {
  Idle,
  Starting,
  Running,
  Errored,
}

export interface GameInstanceInfo {
  instanceId: string;
  worldId: string;
  worldDirectory: string;
  // defaults to "origin/main"
  worldRevision?: string;
}

export class GameInstance {
  static INSTANCES = new Map<string, GameInstance>();

  createdAt = new Date();
  #idleSince = this.createdAt;
  // prettier-ignore
  get idleSince() { return this.#idleSince; }

  bumpIdleTime() {
    this.#idleSince = new Date();
  }

  constructor(public info: GameInstanceInfo) {
    this.resetBooting();
    this.#printLogs();

    GameInstance.INSTANCES.set(info.instanceId, this);
  }

  // #region Logs
  logs = new LogStore();

  #printLogs() {
    const shortId = this.info.instanceId.substring(this.info.instanceId.length - 8);
    this.logs.subscribe().on(entry => {
      if (entry.level === "stdio") return; // already handled by worker stdio forwarding code

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
  // #endregion

  // #region Status
  #state: GameInstanceState = GameInstanceState.Idle;
  #status: string = "Idle";
  #statusDetail: string | undefined;
  // prettier-ignore
  get state() { return this.#state; }
  // prettier-ignore
  get status() { return this.#status; }
  // prettier-ignore
  get statusDetail() { return this.#statusDetail; }
  setStatus(state: GameInstanceState, status: string, detail?: string) {
    this.#state = state;
    this.#status = status;
    this.#statusDetail = detail;

    this.logs.debug("Status updated", { ...{ status }, ...(detail ? { detail } : {}) });
    this.bumpIdleTime();
  }

  #notifyBooted: (() => void) | undefined;
  // deno-lint-ignore no-explicit-any
  #notifyBootFail: ((reason?: any) => void) | undefined;
  #bootedPromise: Promise<unknown> | undefined;
  #booting = false;
  resetBooting() {
    this.#booting = true;
    this.#bootedPromise = new Promise<void>((resolve, reject) => {
      this.#notifyBooted = resolve;
      this.#notifyBootFail = reject;
    }).catch(e => e);
  }
  notifySessionBoot() {
    if (!this.#booting) return;
    this.#notifyBooted?.();
    this.#booting = false;
  }
  // deno-lint-ignore no-explicit-any
  notifySessionBootFail(reason?: any) {
    if (!this.#booting) return;
    this.#notifyBootFail?.(reason);
    this.#booting = false;
  }
  async waitForSessionBoot() {
    if (!this.#booting) return;
    const err = await this.#bootedPromise;
    if (err) throw err;
  }
  // #endregion

  session?: GameSession;

  shutdown() {
    this.session?.shutdown();
    this.setStatus(GameInstanceState.Idle, "Shut down");
  }

  restart() {
    this.setStatus(GameInstanceState.Starting, "Restarting");
    this.session?.shutdown();
    bootInstance(this, true);
  }
}

export const createInstance = (info: GameInstanceInfo): GameInstance => {
  const instance = new GameInstance(info);
  void bootInstance(instance).catch(err => {
    instance.logs.error("An error occurred while booting the instance", { err: err.stack });
    instance.setStatus(GameInstanceState.Errored, "Failed to start");
  });

  return instance;
};

export const bootInstance = async (instance: GameInstance, restart: boolean = false) => {
  instance.setStatus(GameInstanceState.Starting, restart ? "Restarting game" : "Starting game");
  instance.resetBooting();

  instance.setStatus(GameInstanceState.Starting, "Fetching world");
  await fetchWorld(instance);

  try {
    instance.setStatus(GameInstanceState.Starting, "Building world scripts");
    await bundleWorld(instance.info.worldId, {
      dir: instance.info.worldDirectory,
      denoJsonPath: "./deno.json",
    });
  } catch (err) {
    instance.logs.error("Failed to build world bundle", { err: err.stack });
    instance.setStatus(GameInstanceState.Errored, "World script build failed", err.toString());
    instance.notifySessionBootFail();
    return;
  }

  instance.setStatus(GameInstanceState.Starting, "Starting session");
  const session = new GameSession(instance);
  instance.session = session;
  await session.ready();
  instance.setStatus(GameInstanceState.Running, "Started");
  instance.notifySessionBoot();
};
