import { ClientGame, Entity, JsonObject, Vector2 } from "@dreamlab/engine";
import { EditorEntity } from "./editor-entity.ts";
import { Scene, SceneDescEntity } from "./schema.ts";

export class SceneView {
  #game: ClientGame;

  constructor(
    game: ClientGame,
    public scene: Scene,
  ) {
    this.#game = game;
  }

  async initialize() {
    for (const desc of this.scene.world) {
      await this.spawnEntity(this.#game.world, desc);
    }
  }

  async spawnEntity(parent: Entity, desc: SceneDescEntity): Promise<EditorEntity> {
    const entity = parent.spawn({
      _ref: desc.ref,
      name: desc.name,
      type: EditorEntity,
      transform: {
        position: new Vector2(...desc.transform.position),
        rotation: desc.transform.rotation,
        scale: new Vector2(...desc.transform.scale),
      },
      values: {
        entityTypeName: desc.type,
        entityValues: desc.values as JsonObject,
      },
    });

    console.log(entity);

    // TODO: hook up events so that the scene updates when the entity updates ... you know???

    await Promise.all(desc.children.map(childDesc => this.spawnEntity(entity, childDesc)));

    return entity;
  }
}
