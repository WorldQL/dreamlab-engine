import {
  Camera,
  Empty,
  Entity,
  EntityContext,
  EntityDestroyed,
  EntityReparented,
  IBounds,
  PixiEntity,
  Value,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { EditorFacadeComplexCollider } from "./complex-collider.ts";
import { Facades } from "./manager.ts";

const SIZE = 0.2;

export class EmptyFacade extends PixiEntity {
  static readonly icon: string = Empty.icon;

  static {
    Entity.registerType(this, "@editor");
    Facades.register(Empty, this);
  }

  get #isColliderChild(): boolean {
    return this.parent instanceof EditorFacadeComplexCollider;
  }

  get bounds(): IBounds | undefined {
    if (this.#isColliderChild) {
      if (!this.#zoomFn) return undefined;
      const [zoom] = this.#zoomFn;

      const size = SIZE / zoom.value;
      return { width: size, height: size };
    }

    return undefined;
  }

  #zoomFn: [Value<number>, () => void] | undefined;

  constructor(ctx: EntityContext) {
    super(ctx, false);

    const camera = Camera.getActive(this.game);
    const zoom = camera?.values.get("zoom");
    if (zoom) {
      const fn = () => {
        this.#redraw();
      };

      this.#zoomFn = [zoom as Value<number>, fn];
      zoom.onChanged(fn);
    }

    this.on(EntityDestroyed, () => {
      if (this.#zoomFn) {
        const [zoom, fn] = this.#zoomFn;
        zoom.removeChangeListener(fn);

        this.#zoomFn = undefined;
      }
    });

    this.on(EntityReparented, () => {
      this.#redraw();
    });
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#gfx = new PIXI.Graphics();
    this.container.addChild(this.#gfx);

    this.#redraw();
  }

  #gfx: PIXI.Graphics | undefined;
  #redraw(): void {
    if (!this.#gfx) return;
    this.#gfx.clear();

    if (!this.enabled) return;
    if (!this.#isColliderChild) return;

    if (!this.#zoomFn) return;
    const [zoom] = this.#zoomFn;

    const size = SIZE / zoom.value;
    this.#gfx.alpha = 0.8;
    this.#gfx.regularPoly(0, 0, size / 2, 4).fill("white");
  }
}
