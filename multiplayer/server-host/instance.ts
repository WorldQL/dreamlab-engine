import { Scene } from "@dreamlab/scene";

import { LogStore } from "../common-host/log-store.ts";
import { IPCMessageListener } from "../common-host/worker.ts";
import { buildWorld } from "../common-host/world-build.ts";
import { WorkerIPCMessage } from "../server-common/ipc.ts";
import { GameSession } from "./session.ts";
import { fetchWorld } from "./world-fetch.ts";

import * as path from "@std/path";
import { printLogs } from "../common-host/print-logs.ts";

export enum GameInstanceState {
  Idle,
  Starting,
  Running,
  Errored,
}

export interface GameInstanceInfo {
  instanceId: string;
  worldId: string;
  gitId?: string;
  worldDirectory: string;
  // defaults to "origin/main"
  worldRevision?: string;
  // player id
  startedBy?: string;

  editMode?: boolean;

  inspect?: string;

  variant?: "discord" | (string & Record<never, never>);
  discordClientId?: string;
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
    printLogs(`worker …${shortId}`, this.logs.subscribe());
  }
  // #endregion

  // #region Status
  #state: GameInstanceState = GameInstanceState.Idle;
  #status: string = "Idle";
  #statusDetail: string | undefined;
  #statusChangeListeners: ((
    state: GameInstanceState,
    status: string,
    detail?: string,
  ) => void)[] = [];
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
    for (const listener of this.#statusChangeListeners) {
      listener(this.#state, this.#status, this.#statusDetail);
    }

    this.bumpIdleTime();
  }

  onStatusChange(
    listener: (state: GameInstanceState, status: string, detail?: string) => void,
  ): { unsubscribe: () => void } {
    this.#statusChangeListeners.push(listener);
    return {
      unsubscribe: () => {
        const idx = this.#statusChangeListeners.indexOf(listener);
        if (idx === -1) return;
        this.#statusChangeListeners.splice(idx, 1);
      },
    };
  }

  #notifyBooted: (() => void) | undefined;
  // deno-lint-ignore no-explicit-any
  #notifyBootFail: ((reason?: any) => void) | undefined;
  #bootedPromise: Promise<unknown> | undefined;
  #booting = false;
  resetBooting() {
    this.#booting = true;

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    this.#bootedPromise = promise;
    this.#notifyBooted = resolve;
    this.#notifyBootFail = reject;
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

  #notifyPlayBooted: (() => void) | undefined;
  #notifyPlayBootFail: ((error: Error) => void) | undefined;
  #playBootedPromise: Promise<unknown> | undefined;
  #playBooting = false;
  resetPlayBooting() {
    this.#playBooting = true;
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    this.#playBootedPromise = promise;
    this.#notifyPlayBooted = resolve;
    this.#notifyPlayBootFail = reject;
  }
  notifyPlaySessionBoot() {
    if (!this.#playBooting) return;
    this.#notifyPlayBooted?.();
    this.#playBooting = false;
  }
  notifyPlaySessionBootFail(error: Error) {
    if (!this.#playBooting) return;
    this.#notifyPlayBootFail?.(error);
    this.#playBooting = false;
  }
  async waitForPlaySessionBoot() {
    if (!this.#playBooting) return;
    const err = await this.#playBootedPromise;
    if (err) throw err;
  }
  // #endregion

  session?: GameSession;
  // only used in edit mode - running play session for the instance
  playSession?: GameSession;

  shutdown() {
    this.session?.shutdown();
    this.playSession?.shutdown();
    this.playSession = undefined;
    this.setStatus(GameInstanceState.Idle, "Shut down");
  }

  restart() {
    this.setStatus(GameInstanceState.Starting, "Restarting");
    this.session?.shutdown();
    this.playSession?.shutdown();
    this.playSession = undefined;
    bootInstance(this, true);
  }

  sendPlaySessionState() {
    this.session?.ipc.send({
      op: "PlaySessionState",
      running: this.playSession !== undefined,
      paused: this.playSession?.paused ?? false,
    });
  }
}

export const dumpSceneDefinition = async (instance: GameInstance): Promise<Scene> => {
  if (!instance.info.editMode) throw new Error("The given instance is not in edit mode!");
  if (!instance.session)
    throw new Error("The given instance is not currently running a session.");

  const ipc = instance.session.ipc;
  const scene: Scene = await new Promise(resolve => {
    const sceneDefListener = (
      message: WorkerIPCMessage & { op: "SceneDefinitionResponse" },
    ) => {
      resolve(message.sceneJson);
      ipc.removeMessageListener(sceneDefListener as IPCMessageListener["handler"]);
    };
    ipc.send({ op: "SceneDefinitionRequest" });
    ipc.addMessageListener("SceneDefinitionResponse", sceneDefListener);
  });

  return scene;
};

export const createInstance = (info: GameInstanceInfo): GameInstance => {
  const instance = new GameInstance(info);
  void bootInstance(instance).catch(err => {
    instance.logs.error("An error occurred while booting the instance", { err: err.stack });
    instance.setStatus(GameInstanceState.Errored, "Failed to start");
  });

  return instance;
};

export const bootInstance = async (instance: GameInstance, restart: boolean = false) => {
  instance.setStatus(
    GameInstanceState.Starting,
    restart ? "Restarting instance" : "Starting instance",
  );
  instance.resetBooting();

  instance.setStatus(GameInstanceState.Starting, "Building engine");
  await new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "./pre-exec/prepare-play.ts"],
    stdout: "null",
  }).spawn().status;

  instance.setStatus(GameInstanceState.Starting, "Fetching world");
  await fetchWorld(instance);

  try {
    instance.setStatus(GameInstanceState.Starting, "Building world scripts");
    await buildWorld(
      instance.info.worldId,
      instance.info.worldDirectory,
      instance.info.variant ? `_dist_${instance.info.variant}` : "_dist",
    );
  } catch (err) {
    instance.logs.error("Failed to build world bundle", { err: err.stack });
    instance.setStatus(GameInstanceState.Errored, "World script build failed", err.toString());
    instance.notifySessionBootFail();
    return;
  }

  instance.setStatus(GameInstanceState.Starting, "Starting session");
  const session = new GameSession(instance);
  instance.session = session;
  await session.loaded();
  instance.setStatus(GameInstanceState.Running, "Started");
  instance.notifySessionBoot();
};

const doRebuild = Deno.env.get("DEV_REBUILD_ENGINE") === "true";

export const bootPlaySession = async (instance: GameInstance) => {
  if (!instance.info.editMode)
    throw new Error("Can't start a play session for an instance that isn't in edit mode!");
  if (instance.session === undefined)
    throw new Error("Can't start a play session without a running edit session!");

  instance.resetPlayBooting();

  if (doRebuild) {
    instance.logs.debug("play: Building engine...");
    await new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "./pre-exec/prepare-play.ts"],
      stdout: "null",
    }).spawn().status;
  }

  try {
    instance.session.saveScene();
  } catch (err) {
    instance.logs.warn("play: failed to auto-save edit session", err);
  }

  instance.logs.debug("play: Fetching scene definition from edit session...");

  try {
    instance.logs.debug("play: Bundling world...");
    await buildWorld(
      instance.info.worldId,
      instance.info.worldDirectory,
      "_dist_play",
      instance.logs,
    );
  } catch (err) {
    instance.logs.error("Failed to build world bundle for play session", { err: err.stack });
    instance.notifyPlaySessionBootFail(
      new Error("Failed to build world bundle for play session", { cause: err }),
    );
    return;
  }

  try {
    instance.logs.debug("play: Writing scene definition to _dist_play directory");

    const scene = await dumpSceneDefinition(instance);

    const projectJsonFile = path.join(
      instance.info.worldDirectory,
      "_dist_play",
      "project.json",
    );
    const projectDesc = JSON.parse(await Deno.readTextFile(projectJsonFile));
    projectDesc.scenes = { ...(projectDesc.scenes ?? {}), main: scene };
    await Deno.writeTextFile(projectJsonFile, JSON.stringify(projectDesc, undefined, 2));
  } catch (err) {
    instance.logs.error("Failed to write scene definition for play session", {
      err: err.stack,
    });
    instance.notifyPlaySessionBootFail(
      new Error("Failed to write scene definition for play session", {
        cause: err,
      }),
    );
    return;
  }

  instance.logs.debug("play: Booting session...");

  const session = new GameSession(instance, {
    editMode: false,
    worldSubDirectory: "_dist_play",
  });
  instance.playSession = session;
  instance.sendPlaySessionState();
  session.ipc.addMessageListener("PauseChanged", () => {
    instance.sendPlaySessionState();
  });

  try {
    await session.loaded();
  } catch {
    instance.playSession.shutdown();
    instance.playSession = undefined;
  } finally {
    instance.notifyPlaySessionBoot();
  }
};
