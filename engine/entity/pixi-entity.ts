import {
  Camera,
  Entity,
  EntityConstructor,
  EntityContext,
  EntityDestroyed,
  EntityEnableChanged,
  EntityOwnEnableChanged,
  EntityReparented,
  GameRender,
  ScreenSpace,
  SignalSubscription,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export abstract class PixiEntity extends Entity {
  static USE_INTERPOLATION = true;

  public container: PIXI.Container | undefined;

  static: boolean = false;
  hidden: boolean = false;

  #updateContainerPosition() {
    if (!this.game.isClient()) return;
    if (!this.container) return;

    const transform = PixiEntity.USE_INTERPOLATION ? this.interpolated : this.globalTransform;
    const pos = transform.position;
    const rot = transform.rotation;

    this.container.rotation = -rot;
    this.container.zIndex = this.z;

    if (this.#screenspace) {
      const canvas = this.game.renderer.app.canvas;
      const { width, height } = canvas;

      const screenpos = pos.mul({ x: width, y: height }).div(Camera.METERS_TO_PIXELS);
      this.container.position.set(screenpos.x, screenpos.y);
    } else {
      this.container.position.set(pos.x, -pos.y);
    }
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

  #screenspace: boolean = false;
  get screenspace(): boolean {
    return this.#screenspace;
  }

  #updateScene() {
    if (!this.game.isClient()) return;
    if (!this.container) return;

    this.container.removeFromParent();

    this.#screenspace = this.ancestors.some(entity => entity instanceof ScreenSpace);
    const scene = this.#screenspace ? this.game.renderer.screenspace : this.game.renderer.scene;
    scene.addChild(this.container);

    this.#updateContainerPosition();
  }

  #updateVisibility() {
    if (!this.container) return;

    const culled = !this.enabled;
    const visible = !(this.hidden || culled);
    this.container.visible = visible;
  }

  constructor(ctx: EntityContext, defineValues = true) {
    super(ctx);

    // this is a hack to stop editor facades getting tainted
    // FIXME: come up with a better way of doing this ^
    if (defineValues) {
      const staticValue = this.defineValue(
        this.constructor as EntityConstructor<PixiEntity>,
        "static",
      );

      const hiddenValue = this.defineValue(
        this.constructor as EntityConstructor<PixiEntity>,
        "hidden",
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
      this.#updateScene();
      this.#updateVisibility();
    });

    this.on(EntityEnableChanged, () => {
      this.#updateVisibility();
    });

    this.on(EntityDestroyed, () => {
      this.container?.destroy({ children: true });
    });

    this.on(EntityOwnEnableChanged, () => {
      this[internal.interpolationStartTick]();
      this[internal.interpolationStartFrame](0);
    });
  }

  onInitialize() {
    if (!this.game.isClient()) return;

    this.container = new PIXI.Container();

    this.#updateScene();
    this.#updateContainerPosition();
    this.#updateVisibility();
  }
}
