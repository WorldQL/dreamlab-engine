import {
  BehaviorConstructor,
  ClientGame,
  DUMMY_CLIENT_KV,
  Empty,
  Entity,
  ValueTypeTag,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { createId } from "@dreamlab/vendor/nanoid.ts";

const RUN_BEHAVIOR_INITIALIZATION = false;

export interface ValueInfo<T = unknown> {
  key: string;
  typeTag: ValueTypeTag<T>;
  default: T;
}

export interface BehaviorTypeInfo {
  typeName: string;
  values: ValueInfo[];
}

export class BehaviorTypeInfoService {
  #cache = new Map<string, BehaviorTypeInfo>();

  constructor(private game: ClientGame) {}

  #createInfo(dummyGame: ClientGame, behaviorType: BehaviorConstructor): BehaviorTypeInfo {
    const dummyEntity = dummyGame.world.spawn({ type: Empty, name: "DummyEntity" });
    dummyEntity.cast = <T extends Entity>() => this as unknown as T;
    const behavior = new behaviorType({ game: dummyGame, entity: dummyEntity });
    dummyEntity.behaviors.push(behavior);
    dummyGame[internal.behaviorLoader].initialize(behaviorType);

    behavior[internal.implicitSetup]();
    behavior.setup();

    if (RUN_BEHAVIOR_INITIALIZATION) {
      try {
        behavior[internal.behaviorSpawn]();
      } catch (_err) {
        // ignore
      }
    }

    const info: BehaviorTypeInfo = {
      typeName: behaviorType.name,
      values: behavior.values
        .entries()
        .map(([key, value]) => ({
          key,
          default: value.value,
          typeTag: value.typeTag,
        }))
        .toArray(),
    };

    dummyEntity.destroy();

    return info;
  }

  async get(script: string): Promise<BehaviorTypeInfo> {
    const cached = this.#cache.get(script);
    if (cached) return cached;

    using dummyGame = await this.#createDummyGame();
    try {
      const behaviorType = await dummyGame.loadBehavior(script);
      const info = this.#createInfo(dummyGame, behaviorType);
      this.#cache.set(script, info);
      return info;
    } catch (err) {
      console.error(err);
      return { typeName: script, values: [] };
    }
  }

  async hasBehavior(script: string): Promise<boolean> {
    const cached = this.#cache.get(script);
    if (cached) return true;

    using dummyGame = await this.#createDummyGame();

    try {
      await dummyGame.loadBehavior(script);
      return true;
    } catch {
      return false;
    }
  }

  async reload(script: string): Promise<BehaviorTypeInfo> {
    this.#cache.delete(script);
    return await this.get(script);
  }

  rename(oldScript: string, newScript: string) {
    const existingInfo = this.#cache.get(oldScript);
    if (existingInfo) {
      this.#cache.delete(oldScript);
      this.#cache.set(newScript, existingInfo);
    }
  }

  async #createDummyGame(): Promise<ClientGame> {
    const dummyGame = new ClientGame(
      {
        container: document.createElement("div"),
        instanceId: "dummy-instance",
        worldId: "dummy-world",
        network: {
          ping: 0,
          connections: [],
          self: createId("conn"),
          sendCustomMessage() {},
          broadcastCustomMessage() {},
          onReceiveCustomMessage() {},
          disconnect() {},
        },
        kv: DUMMY_CLIENT_KV,
      },
      true /*headless*/,
    );
    dummyGame.cloudAssetBaseURL = this.game.cloudAssetBaseURL;
    dummyGame.worldScriptBaseURL = this.game.worldScriptBaseURL;

    await dummyGame.initialize();

    // TODO: materialize EditorEntities objects into dummyGame world (à la play mode).
    // this first requires a better pipeline for edit world => scene def => play world

    return dummyGame;
  }
}
