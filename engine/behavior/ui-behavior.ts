import { Behavior, UILayer, UIPanel } from "@dreamlab/engine";
import type { BaseElement } from "../../ui/element.ts";

export abstract class UIBehavior extends Behavior {
  private uiRoot: HTMLElement | undefined;
  public uiElement: HTMLElement | BaseElement | undefined;
  private styleElement: HTMLStyleElement | undefined;
  private cssContent: string = "";

  #ui: UILayer | UIPanel | undefined;
  get ui(): UILayer | UIPanel {
    if (!this.#ui) throw new Error("UIBehaviors must be attached to UILayer or UIPanel");
    return this.#ui;
  }

  /**
   * Adds a CSS stylesheet that will be applied to the UI root element.
   * This allows styling elements with class names used in your render method.
   *
   * @param cssString The CSS rules to apply
   */
  setCss(cssString: string): void {
    if (!this.game.isClient()) return;

    this.cssContent = cssString;

    // If we already have a UI root and style element, update it
    if (this.uiRoot) {
      this.ensureStyleElement();
    }
  }

  private ensureStyleElement(): void {
    // Create style element if it doesn't exist
    if (!this.styleElement) {
      this.styleElement = document.createElement("style");
      this.styleElement.id = `ui-behavior-style-${this.entity.id}`;

      // Insert the style element at the beginning of the UI root
      if (this.uiRoot?.firstChild) {
        this.uiRoot.insertBefore(this.styleElement, this.uiRoot.firstChild);
      } else if (this.uiRoot) {
        this.uiRoot.appendChild(this.styleElement);
      }
    }

    // Set the CSS content
    if (this.styleElement) {
      this.styleElement.textContent = this.cssContent;
    }
  }

  rerender() {
    if (this.uiRoot) {
      // Ensure style element exists before rendering
      this.ensureStyleElement();

      const newUI = this.render();
      if (this.uiElement && this.uiElement.parentNode === this.uiRoot) {
        this.uiRoot.replaceChild(newUI, this.uiElement);
      } else {
        this.uiRoot.appendChild(newUI);
      }
      this.uiElement = newUI;
      if (this.uiElement.style.pointerEvents === "") {
        this.uiElement.style.pointerEvents = "auto";
      }
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

    // Now that we have a UI root, we can ensure the style element is created
    if (this.cssContent) {
      this.ensureStyleElement();
    }

    this.rerender();
  }

  protected abstract render(): BaseElement;

  hide = () => {
    if (this.uiElement && this.uiElement.parentNode) {
      this.uiElement.remove();
    }
  };

  show = () => {
    if (this.uiRoot) {
      // uiElement still exists in memory after remove(), so we just re-append it.
      if (this.uiElement && this.uiElement.parentNode !== this.uiRoot) {
        // Ensure the style element is first
        this.ensureStyleElement();
        this.uiRoot.appendChild(this.uiElement);
      }
      this.rerender();
    }
  };
}
