import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { SignalSubscription } from "../signal.ts";
import { EntityDestroyed, EntityReparented, GameRender } from "../signals/mod.ts";
import { Entity, EntityConstructor, EntityContext } from "./entity.ts";

export abstract class PixiEntity extends Entity {
  protected container: PIXI.Container | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.on(EntityReparented, () => {
      if (!this.container) return;

      // cull pixi container if in prefabs tree
      const visible = this.root !== this.game.prefabs;
      this.container.visible = visible;
    });

    this.defineValues(this.constructor as EntityConstructor<PixiEntity>, "static");

    // force add the render listener if not static lmao
    if (!this.static) {
      this.#gameRenderListener = this.game.on(GameRender, () => {
        this.#updateContainerPosition();
      });

      this.externalListeners.push(this.#gameRenderListener);
    }

    this.on(EntityDestroyed, () => {
      this.container?.destroy({ children: true });
    });
  }

  // NB(Charlotte):
  // the idea here is that we don't need to interpolate any pixi entity that's not going to move,
  // so we can save on a whole frame event listener when static is set to true.
  // with 10,000 static sprites on firefox 130b9 this takes me from 50fps to 140fps
  #gameRenderListener: SignalSubscription<GameRender> | undefined;
  get static(): boolean {
    return this.#gameRenderListener !== undefined;
  }
  set static(value: boolean) {
    this.#gameRenderListener?.unsubscribe();
    this.#gameRenderListener = undefined;

    if (!value) {
      this.#gameRenderListener = this.game.on(GameRender, () => {
        this.#updateContainerPosition();
      });

      this.externalListeners.push(this.#gameRenderListener);
    }
  }

  #updateContainerPosition() {
    if (!this.container) return;

    const pos = this.interpolated.position;
    const rot = this.interpolated.rotation;
    this.container.position.set(pos.x, -pos.y);
    this.container.rotation = -rot;
    this.container.zIndex = this.z;
  }

  onInitialize() {
    if (!this.game.isClient()) return;

    this.container = new PIXI.Container();
    this.game.renderer.scene.addChild(this.container);

    this.#updateContainerPosition();
  }
}
