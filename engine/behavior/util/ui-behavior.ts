import { Behavior, UILayer, UIPanel } from "@dreamlab/engine";

export abstract class UIBehavior extends Behavior {
  private uiRoot: ShadowRoot | undefined;
  private container: HTMLElement | undefined;

  #ui: UILayer | UIPanel | undefined;

  rerender() {
    this.container?.replaceChildren(this.render());
  }

  onInitialize(): void {
    if (!this.game.isClient()) return;

    if (!(this.entity instanceof UILayer || this.entity instanceof UIPanel)) {
      throw new Error("UIBehaviors must be attached to UILayer or UIPanel");
    }

    if (this.entity instanceof UILayer) {
      this.#ui = this.entity.cast(UILayer);
    }

    if (this.entity instanceof UIPanel) {
      this.#ui = this.entity.cast(UIPanel);
    }

    this.container = document.createElement("div");
    this.uiRoot = this.#ui?.dom;
    this.uiRoot?.appendChild(this.container);
    this.rerender();
  }

  protected abstract render(): Node;

  hide = () => {
    if (this.container) {
      this.container.remove();
    }
  };

  show = () => {
    if (this.container && this.uiRoot) {
      this.uiRoot.appendChild(this.container);
      this.rerender();
    }
  };
}
