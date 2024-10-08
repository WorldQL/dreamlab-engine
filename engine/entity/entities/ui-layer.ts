import { EntityDestroyed, EntityEnableChanged } from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";

export class UILayer extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "🖼️";
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

    // TODO: Listen to Z index changes
  }

  onInitialize() {
    if (!this.game.isClient()) return;

    const [outer, root] = this.game.ui.create(this);
    const element = document.createElement("div");
    this.#ui = { outer, root, element };

    element.id = "root";
    element.style.zIndex = this.z.toString();

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
