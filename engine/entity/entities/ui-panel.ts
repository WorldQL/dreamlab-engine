import { Entity, EntityContext } from "../entity.ts";
import { InterpolatedEntity } from "../interpolated-entity.ts";
import { EntityDestroyed, GameRender } from "../../signals/mod.ts";
import { Camera } from "./camera.ts";

export class UIPanel extends InterpolatedEntity {
  public static readonly icon = "🖼️";

  #ui: { outer: HTMLDivElement; root: ShadowRoot; element: HTMLDivElement } | undefined;
  public get root(): ShadowRoot {
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
      this.#updateDiv();
    });

    this.on(EntityDestroyed, () => {
      if (!this.#ui) return;

      this.#ui.element.remove();
      this.#ui.outer.remove();
    });
  }

  #updateDiv() {
    if (!this.#ui) return;
    const { element } = this.#ui;

    const camera = Camera.getActive(this.game);
    if (!camera) return;

    const pos = this.interpolated.position;
    const screen = camera.worldToScreen(pos);

    element.style.left = screen.x.toString() + "px";
    element.style.top = screen.y.toString() + "px";

    const rot = camera.smoothed.rotation - this.interpolated.rotation;
    // TODO: uhh this doesnt work
    const scaleX = this.globalTransform.scale.x / camera.smoothed.scale.x;
    const scaleY = this.globalTransform.scale.y / camera.smoothed.scale.y;

    element.style.transform = `translateX(-50%) translateY(-50%) rotate(${rot}rad) scale(${scaleX}, ${scaleY})`;
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
Entity.registerType(UIPanel, "@core");
