import { element as elem } from "@dreamlab/ui";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";
import { LogViewer } from "./log-viewer.ts";
import { Terminal, icon } from "../_icons.ts";
import { ClientGame } from "@dreamlab/engine";

export class BottomTabs implements InspectorUIWidget {
  #container: HTMLElement;
  #logViewer: LogViewer;
  #logViewerContent: HTMLElement;

  constructor(
    private uiRoot: HTMLElement,
    private games: { edit: ClientGame; play?: ClientGame },
  ) {
    this.#container = elem("div", { className: "bottom-tabs" });

    this.#logViewerContent = elem("div", { id: "log-viewer-content" });
    this.#logViewer = new LogViewer(this.#logViewerContent, games);
  }

  setup(ui: InspectorUI): void {
    const tabBar = elem("div", { className: "bottom-tabs-bar" }, [
      elem("div", { className: "bottom-tab active" }, [
        icon(Terminal),
        elem("span", {}, ["Logs"]),
      ]),
    ]);

    const content = elem("div", { className: "bottom-tabs-content" }, [this.#logViewerContent]);

    this.#container.append(tabBar, content);
    this.#logViewer.setup(ui);
  }

  show(uiRoot: HTMLElement): void {
    const bottomBar = uiRoot.querySelector("#bottom-bar");
    if (bottomBar) {
      bottomBar.appendChild(this.#container);
    }
  }

  hide(): void {
    this.#container.remove();
  }
}
