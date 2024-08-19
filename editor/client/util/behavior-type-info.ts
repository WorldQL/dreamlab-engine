import { BehaviorConstructor, ClientGame, Empty, ValueTypeTag } from "@dreamlab/engine";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import * as internal from "../../../engine/internal.ts";

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
  #dummyGame: ClientGame;
  #cache = new Map<string, BehaviorTypeInfo>();

  constructor(game: ClientGame) {
    this.#dummyGame = new ClientGame({
      container: document.createElement("div"),
      instanceId: "dummy-instance",
      worldId: "dummy-world",
      network: {
        ping: 0,
        connections: [],
        self: generateCUID("conn"),
        sendCustomMessage() {},
        broadcastCustomMessage() {},
        onReceiveCustomMessage() {},
        disconnect() {},
      },
    });
    this.#dummyGame.cloudAssetBaseURL = game.cloudAssetBaseURL;
    this.#dummyGame.worldScriptBaseURL = game.worldScriptBaseURL;
  }

  #createInfo(behaviorType: BehaviorConstructor): BehaviorTypeInfo {
    const dummyEntity = this.#dummyGame.world.spawn({ type: Empty, name: "DummyEntity" });
    const behavior = dummyEntity.addBehavior({ type: behaviorType });

    const info: BehaviorTypeInfo = {
      typeName: behaviorType.name,
      values: [...behavior.values.entries()].map(([key, value]) => ({
        key,
        default: value.value,
        typeTag: value.typeTag,
      })),
    };

    dummyEntity.destroy();

    return info;
  }

  async get(script: string): Promise<BehaviorTypeInfo> {
    const cached = this.#cache.get(script);
    if (cached) return cached;

    const behaviorType = await this.#dummyGame.loadBehavior(script);
    const info = this.#createInfo(behaviorType);
    this.#cache.set(script, info);
    return info;
  }

  async reload(script: string): Promise<BehaviorTypeInfo> {
    const cacheBustingURL = new URL(this.#dummyGame.resolveResource(script));
    cacheBustingURL.searchParams.set("_editor_cache", generateCUID("cch"));

    const behaviorType = await this.#dummyGame[internal.behaviorLoader].loadScriptFromSource(
      script,
      cacheBustingURL.toString(),
    );
    const info = this.#createInfo(behaviorType);
    this.#cache.set(script, info);
    return info;
  }
}
