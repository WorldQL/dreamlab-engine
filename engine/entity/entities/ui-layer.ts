import { Entity, EntityContext } from "../entity.ts";
import { InterpolatedEntity } from "../interpolated-entity.ts";
import { EntityDestroyed } from "../../signals/mod.ts";

export class UILayer extends InterpolatedEntity {
  public static readonly icon = "🖼️";

  #ui: { outer: HTMLDivElement; root: ShadowRoot; element: HTMLDivElement } | undefined;
  public get element(): HTMLDivElement | undefined {
    return this.#ui?.element;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.on(EntityDestroyed, () => {
      if (!this.#ui) return;

      this.#ui.element.remove();
      this.#ui.outer.remove();
    });
  }

  onInitialize() {
    if (!this.game.isClient()) return;

    const [outer, root] = this.game.ui.create(this);
    const element = document.createElement("div");
    this.#ui = { outer, root, element };

    element.id = "root";

    const style = document.createElement("style");
    const css = `
#root {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

#root > * {
  pointer-events: auto;
}
`;

    style.appendChild(document.createTextNode(css));
    root.appendChild(style);
    root.appendChild(element);
  }
}
Entity.registerType(UILayer, "@core");
