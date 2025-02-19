import { JSX } from "@dreamlab/ui/jsx-runtime";
import { ClientGame } from "../../../engine/game.ts";

export abstract class DreamlabEditorUIComponent {
  private uiRoot: HTMLElement | undefined;
  private container: HTMLElement | undefined;

  constructor(protected game: ClientGame) {}

  protected abstract render(): JSX.Element;

  rerender() {
    this.container?.replaceChildren(this.render());
  }

  mount(uiRoot: HTMLElement): void {
    this.uiRoot = uiRoot;
    this.container = (<div></div>) as HTMLElement; // should be a fragment but they're not supported yet

    this.uiRoot.appendChild(this.container);
    this.rerender();
  }

  unmount() {
    this.hide();
    this.uiRoot = undefined;
    this.container = undefined;
  }

  hide(): void {
    if (this.container) {
      this.container.remove();
    }
  }

  show() {
    if (this.container && this.uiRoot) {
      this.uiRoot.appendChild(this.container);
      this.rerender();
    } else {
      console.warn("Attempted to show DreamlabEditorUIComponent that has not been mounted.");
    }
  }
}
