import { Behavior, UILayer, UIPanel } from "@dreamlab/engine";

export abstract class UIBehavior extends Behavior {
  private uiRoot: HTMLElement | undefined;
  private uiElement: HTMLElement | undefined;

  #ui: UILayer | UIPanel | undefined;
  #enablePointerEvents = true;
  set enablePointerEvents(val: boolean) {
    this.#enablePointerEvents = val;
    this.updatePointerEvents();
  }

  private updatePointerEvents() {
    if (this.uiElement instanceof HTMLElement) {
      this.uiElement.style.pointerEvents = this.#enablePointerEvents ? "auto" : "none";
    }
  }

  rerender() {
    if (this.uiRoot) {
      const newUI = this.render();
      if (this.uiElement && this.uiElement.parentNode === this.uiRoot) {
        this.uiRoot.replaceChild(newUI, this.uiElement);
      } else {
        this.uiRoot.appendChild(newUI);
      }
      this.uiElement = newUI;
      this.updatePointerEvents();
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

    this.uiRoot = this.#ui.element;
    this.rerender();
  }

  protected abstract render(): HTMLElement;

  hide = () => {
    if (this.uiElement && this.uiElement.parentNode) {
      this.uiElement.remove();
    }
  };

  show = () => {
    if (this.uiRoot) {
      if (this.uiElement && this.uiElement.parentNode !== this.uiRoot) {
        this.uiRoot.appendChild(this.uiElement);
      }
      if (this.uiElement) {
        this.updatePointerEvents();
      } else {
        this.rerender();
      }
    }
  };
}
