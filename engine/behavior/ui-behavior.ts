import { Behavior, UILayer, UIPanel } from "@dreamlab/engine";

export abstract class UIBehavior extends Behavior {
  private uiRoot: HTMLElement | undefined;
  private container: HTMLElement | undefined;

  #ui: UILayer | UIPanel | undefined;
  #enablePointerEvents = true;
  set enablePointerEvents(val: boolean) {
    this.#enablePointerEvents = val;
    this.rerender();
  }

  rerender() {
    if (this.container) {
      this.container.replaceChildren(this.render());
      this.container.style.pointerEvents = this.#enablePointerEvents ? "auto" : "none";
    }
  }

  onInitialize(): void {
    if (!this.game.isClient()) return;

    if (this.entity instanceof UILayer) {
      this.#ui = this.entity.cast(UILayer);
    } else if (this.entity instanceof UIPanel) {
      this.#ui = this.entity.cast(UIPanel);
    } else {
      throw new Error("UIBehaviors must be attached to UILayer or UIPanel");
    }

    this.container = document.createElement("div");
    this.uiRoot = this.#ui.element;
    this.uiRoot.appendChild(this.container);
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
