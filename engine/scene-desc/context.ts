import { Entity } from "../entity/mod.ts";
import { Game } from "../game.ts";
import { Vector2 } from "../math/mod.ts";
import * as internal from "../internal.ts";

import { Scene, SceneDescEntity } from "./schema.ts";
import { BehaviorDefinition } from "../behavior/mod.ts";

// TODO: scene desc that autosyncs entity values (EntityRename, EntityTransformChanged, SyncedValueChanged)
export class SceneEditContext {
  #game: Game;
  scene: Scene;

  #entityToDescMap = new WeakMap<Entity, SceneDescEntity>();
  #descToEntityMap = new WeakMap<SceneDescEntity, Entity>();

  constructor(game: Game, scene: Scene) {
    this.#game = game;
    this.scene = scene;
  }

  async initialize() {
    await Promise.all(
      this.scene.registration.map(uri =>
        import(this.#game.resolveResource(uri)).catch(() => {}),
      ),
    );

    for (const desc of this.scene.world) {
      this.#spawnEntity(this.#game.world, desc);
    }
  }

  async #spawnEntity(parent: Entity, desc: SceneDescEntity) {
    const behaviors = (
      await Promise.all(
        desc.behaviors.map(async behaviorDesc => {
          try {
            const loader = this.#game[internal.behaviorScriptLoader];
            const behaviorType = await loader.loadScript(behaviorDesc.script);

            return { type: behaviorType, values: behaviorDesc.values, _ref: behaviorDesc.ref };
          } catch (err) {
            console.warn("Failed to load behavior: " + behaviorDesc.script, err);
          }
          return undefined;
        }),
      )
    ).filter(b => b !== undefined) as BehaviorDefinition[];

    const entity = parent.spawn({
      _ref: desc.ref,
      name: desc.name,
      type: Entity.getEntityType(desc.type),
      transform: {
        position: new Vector2(...desc.transform.position),
        rotation: desc.transform.rotation,
        scale: new Vector2(...desc.transform.scale),
      },
      values: desc.values,
      behaviors,
    });

    await Promise.all(desc.children.map(childDesc => this.#spawnEntity(entity, childDesc)));
  }
}
