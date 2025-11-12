import {
  Entity,
  EntityConstructor,
  EntityContext,
  EntityDestroyed,
  EntityEnableChanged,
  EntityOwnEnableChanged,
  EntityReparented,
  GameRender,
  SignalSubscription,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export abstract class PixiEntity<
  T extends PIXI.ContainerChild = PIXI.Container,
> extends Entity {
  static USE_INTERPOLATION = true;

  #target: T | undefined;
  get container(): T | undefined {
    return this.#target;
  }

  createTarget(): T {
    return new PIXI.Container() as T;
  }

  static: boolean = false;
  hidden: boolean = false;

  #updateContainerPosition() {
    if (!this.#target) return;
    if (!this.#target.position) return;

    const transform = PixiEntity.USE_INTERPOLATION ? this.interpolated : this.globalTransform;
    const pos = transform.position;
    const rot = transform.rotation;

    this.#target.position.set(pos.x, -pos.y);
    this.#target.rotation = -rot;
    this.#target.zIndex = this.z;
  }

  // NB(Charlotte):
  // the idea here is that we don't need to interpolate any pixi entity that's not going to move,
  // so we can save on a whole frame event listener when static is set to true.
  // with 10,000 static sprites on firefox 130b9 this takes me from 50fps to 140fps
  #gameRenderListener: SignalSubscription<GameRender> | undefined;
  #updateTransformListeners() {
    if (this.#gameRenderListener) {
      const idx = this.externalListeners.indexOf(this.#gameRenderListener);
      if (idx !== -1) this.externalListeners.splice(idx, 1);

      this.#gameRenderListener.unsubscribe();
    }

    this.#gameRenderListener = undefined;

    const shouldListen = !this.static && !this.hidden;
    if (shouldListen) {
      this.#gameRenderListener = this.game.on(GameRender, () => {
        this.#updateContainerPosition();
      });

      this.externalListeners.push(this.#gameRenderListener);
    }
  }

  #updateVisibility() {
    if (!this.#target) return;
    this.#updateContainerPosition();

    const culled = !this.enabled;
    const visible = !(this.hidden || culled);
    this.#target.visible = visible;
  }

  constructor(ctx: EntityContext, defineValues = true) {
    super(ctx);

    // this is a hack to stop editor facades getting tainted
    // FIXME: come up with a better way of doing this ^
    if (defineValues) {
      const staticValue = this.defineValue(
        this.constructor as EntityConstructor<PixiEntity>,
        "static",
        {
          description:
            "If true, the entity will not update its position or rotation, optimizing performance by avoiding interpolation.",
        },
      );

      const hiddenValue = this.defineValue(
        this.constructor as EntityConstructor<PixiEntity>,
        "hidden",
        { description: "If true, the entity is hidden and will not be visible in the scene." },
      );

      staticValue.onChanged(() => this.#updateTransformListeners());
      hiddenValue.onChanged(() => {
        this.#updateVisibility();
        this.#updateTransformListeners();
      });
    }

    // force add the render listener if not static
    this.#updateTransformListeners();

    this.on(EntityReparented, () => {
      this.#updateVisibility();
    });

    this.on(EntityEnableChanged, () => {
      this.#updateVisibility();
    });

    this.on(EntityDestroyed, () => {
      this.#target?.destroy({ children: true });
    });

    this.on(EntityOwnEnableChanged, () => {
      this[internal.interpolationStartTick]();
      this[internal.interpolationStartFrame](0);
    });
  }

  onInitialize() {
    if (!this.game.isClient()) return;

    this.#target = this.createTarget();
    this.#target.eventMode = "none";
    this.#target.interactiveChildren = false;
    this.game.renderer.scene.addChild(this.#target);

    this.#updateContainerPosition();
    this.#updateVisibility();
  }
}
