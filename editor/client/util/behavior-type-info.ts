import { ClientGame, Empty, ValueTypeTag } from "@dreamlab/engine";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";

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

  async get(scriptURI: string): Promise<BehaviorTypeInfo> {
    const cached = this.#cache.get(scriptURI);
    if (cached) return cached;

    const behaviorType = await this.#dummyGame.loadBehavior(scriptURI);
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

    this.#cache.set(scriptURI, info);
    return info;
  }
}
