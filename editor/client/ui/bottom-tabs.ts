import { element as elem } from "@dreamlab/ui";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";
import { LogViewer } from "./log-viewer.ts";
import { PrefabViewer } from "./prefab-viewer.ts";
import { Terminal, Box, icon } from "../_icons.ts";
import { ClientGame } from "@dreamlab/engine";

export class BottomTabs implements InspectorUIWidget {
  #container: HTMLElement;
  #logViewer: LogViewer;
  #prefabViewer: PrefabViewer;
  #logContent: HTMLElement;
  #prefabContent: HTMLElement;

  constructor(games: { edit: ClientGame; play?: ClientGame }) {
    this.#container = elem("div", { className: "bottom-tabs" });

    this.#logContent = elem("div", { id: "log-viewer-content" });
    this.#prefabContent = elem("div", { id: "prefab-viewer-content" });

    this.#logViewer = new LogViewer(this.#logContent, games);
    this.#prefabViewer = new PrefabViewer(games.edit, this.#prefabContent);
  }

  setup(ui: InspectorUI): void {
    const switchTab = (tabId: string) => {
      const tabs = this.#container.querySelectorAll(".bottom-tab");
      tabs.forEach(tab => {
        if (tab instanceof HTMLElement) {
          tab.classList.toggle("active", tab.getAttribute("data-tab-id") === tabId);
        }
      });

      this.#logContent.style.display = tabId === "logs" ? "flex" : "none";
      this.#prefabContent.style.display = tabId === "prefabs" ? "flex" : "none";
    };

    const logsTab = elem("div", { className: "bottom-tab active" });
    logsTab.setAttribute("data-tab-id", "logs");
    logsTab.append(icon(Terminal), elem("span", {}, ["Logs"]));

    const prefabsTab = elem("div", { className: "bottom-tab" });
    prefabsTab.setAttribute("data-tab-id", "prefabs");
    prefabsTab.append(icon(Box), elem("span", {}, ["Prefabs"]));

    const tabBar = elem("div", { className: "bottom-tabs-bar" }, [logsTab, prefabsTab]);

    tabBar.addEventListener("click", e => {
      const tab = (e.target as HTMLElement).closest(".bottom-tab");
      if (tab && tab instanceof HTMLElement) {
        const tabId = tab.getAttribute("data-tab-id");
        if (tabId) switchTab(tabId);
      }
    });

    const content = elem("div", { className: "bottom-tabs-content" }, [
      this.#logContent,
      this.#prefabContent,
    ]);

    this.#prefabContent.style.display = "none";
    this.#container.append(tabBar, content);

    this.#logViewer.setup(ui);
    this.#prefabViewer.setup(ui);
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
