import { Entity, EntityContext } from "../entity.ts";
import { InterpolatedEntity } from "../interpolated-entity.ts";
import { EntityDestroyed } from "../../signals/mod.ts";

export class UILayer extends InterpolatedEntity {
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
