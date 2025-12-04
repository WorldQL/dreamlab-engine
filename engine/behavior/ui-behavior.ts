// deno-lint-ignore-file no-explicit-any
import { Behavior, UILayer, UIPanel } from "@dreamlab/engine";
import type { BaseElement } from "@dreamlab/ui";
import morphdom from "@dreamlab/vendor/morphdom.ts";

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
    if (!this.uiRoot) return;

    this.ensureStyleElement();

    const newTree = this.render(); // fresh virtual subtree

    /* ---- first time: just mount ---- */
    if (!this.uiElement) {
      this.uiRoot.appendChild(newTree); // place it *after* <style>
      this.uiElement = newTree;
      if (this.uiElement.style.pointerEvents === "")
        this.uiElement.style.pointerEvents = "auto"; // keep reference to this div
      return;
    }

    /* ---- subsequent renders: diff-and-patch ---- */
    morphdom(this.uiElement, newTree, {
      onBeforeElUpdated(fromEl, toEl) {
        // #region listener handling
        // please see key.startsWith("on") in element.ts
        for (const prop of Object.keys(toEl)) {
          if (!prop.startsWith("on")) continue;
          const newFn = (toEl as any)[prop];
          if (typeof newFn !== "function") continue;

          const oldFn = (fromEl as any)[prop];
          if (oldFn !== newFn) {
            // overwrite the DOM-property (onclick, onmousedown, etc)
            (fromEl as any)[prop.toLowerCase()] = newFn;
            // update our stash too
            (fromEl as any)[prop] = newFn;
          }
        }
        // #endregion

        // #region input handling
        if (fromEl.matches("input, textarea, select")) {
          const from = fromEl as HTMLInputElement;
          const to = toEl as HTMLInputElement;

          // if you want an uncontrolled checkbox or radio or other input.
          if (to.dataset.uncontrolled) {
            to.value = from.value;
            to.checked = from.checked;
            return true;
          }

          // required to make select boxes not get reset on rerender.
          // also allows for controlling selected option with data-value
          if (to instanceof HTMLSelectElement) {
            // to.value is always the first <option> child because it's getting reinitialized and setting
            // the "value" attribute in html doesn't actually work for <select>. So we must use data-value instead.
            const dataValue = to.dataset.value;
            to.value = from.value; // required because the old dom node has the actual user select.

            // select element manually if data-value is passed.
            const dataSelected = to.querySelector(`option[value="${dataValue}"]`);
            if (dataSelected instanceof HTMLOptionElement) {
              dataSelected.selected = true;
              return true;
            }
          }

          // allow controlled input components but also keep value if uncontrolled
          // basically if the new dom defines value we throw away user's input.
          if (to.value) {
            return true;
          }

          to.value = from.value;
        }
        // #endregion

        return true; // keep patching the rest of the element
      },
    });

    if (this.uiElement.style.pointerEvents === "") this.uiElement.style.pointerEvents = "auto";
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

    // Clean up any existing elements from previous hot reload
    if (this.uiRoot) {
      while (this.uiRoot.firstChild) {
        this.uiRoot.removeChild(this.uiRoot.firstChild);
      }
    }

    // Reset references
    this.uiElement = undefined;
    this.styleElement = undefined;

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
