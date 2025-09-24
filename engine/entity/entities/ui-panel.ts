import {
  Camera,
  Entity,
  EntityContext,
  EntityDestroyed,
  EntityEnableChanged,
  GameRender,
} from "@dreamlab/engine";

export class UIPanel extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🎨";
  readonly bounds: undefined;

  #ui: { outer: HTMLDivElement; root: ShadowRoot; element: HTMLDivElement } | undefined;
  public get dom(): ShadowRoot {
    if (!this.game.isClient()) {
      throw new Error("cannot access property 'root' on the server");
    }

    if (!this.#ui) {
      throw new Error(`${this.id} has not been initialized`);
    }

    return this.#ui?.root;
  }

  public get element(): HTMLDivElement {
    if (!this.game.isClient()) {
      throw new Error("cannot access property 'element' on the server");
    }

    if (!this.#ui) {
      throw new Error(`${this.id} has not been initialized`);
    }

    return this.#ui?.element;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.listen(this.game, GameRender, () => {
      if (!this.enabled) return;
      this.#updateDiv();
    });

    this.on(EntityEnableChanged, ({ enabled }) => {
      if (!this.#ui) return;
      if (enabled) this.#ui.root.append(this.#ui.element);
      else this.#ui.element.remove();
    });

    this.on(EntityDestroyed, () => {
      if (!this.#ui) return;

      this.#ui.element.remove();
      this.#ui.outer.remove();
    });
  }

  #updateDiv() {
    if (!this.game.isClient()) return;
    if (!this.#ui) return;
    const { element } = this.#ui;

    // TODO: Culling

    const camera = Camera.getActive(this.game);
    if (!camera) return; // TODO: Cull when no camera exists

    const resolution = globalThis.devicePixelRatio;
    const screen = camera.worldToScreen(this.interpolated.position, true);

    element.style.zIndex = this.z.toString();
    element.style.left = screen.x.toString() + "px";
    element.style.top = screen.y.toString() + "px";

    let scale = 1;
    if (!camera.unlocked) {
      const canvas = this.game.renderer.app.canvas;
      const w = canvas.width / Camera.METERS_TO_PIXELS_UNSCALED;
      const h = canvas.height / Camera.METERS_TO_PIXELS_UNSCALED;
      const axis = Math.min(w, h);
      scale = axis / Camera.TARGET_VIEWPORT_SIZE / resolution;
    }

    element.style.transform = `translateX(-50%) translateY(-50%)
      rotate(${camera.smoothed.rotation - this.interpolated.rotation}rad)
      scaleX(${(this.interpolated.scale.x / camera.smoothed.scale.x) * scale})
      scaleY(${(this.interpolated.scale.y / camera.smoothed.scale.y) * scale})`;
  }

  onInitialize() {
    if (!this.game.isClient()) return;

    const [outer, root] = this.game.ui.create(this);
    const element = document.createElement("div");
    this.#ui = { outer, root, element };

    element.style.pointerEvents = "auto";
    element.style.position = "absolute";
    this.#updateDiv();

    root.appendChild(element);
  }
}
