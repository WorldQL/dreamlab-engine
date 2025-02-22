import { element as elem } from "@dreamlab/ui";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";
import { LogViewer } from "./log-viewer.ts";
import { PrefabViewer } from "./prefab-viewer.ts";
import { Terminal, Box, icon, Bot, Wand } from "../_icons.ts";
import { ClientGame } from "@dreamlab/engine";
import { Assistant } from "./assistant/assistant.tsx";
import { NIL_UUID } from "jsr:@std/uuid@1/constants";

export class BottomTabs implements InspectorUIWidget {
  #container: HTMLElement;
  #logViewer: LogViewer;
  #assistant: Assistant;
  #prefabViewer: PrefabViewer;
  #logContent: HTMLElement;
  #prefabContent: HTMLElement;
  #assistantContent: HTMLElement;

  constructor(games: { edit: ClientGame; play?: ClientGame }) {
    this.#container = elem("div", { className: "bottom-tabs" });

    this.#logContent = elem("div", { id: "log-viewer-content" });
    this.#prefabContent = elem("div", { id: "prefab-viewer-content" });
    this.#assistantContent = elem("div", { id: "assistant-viewer-content" });

    this.#logViewer = new LogViewer(this.#logContent, games);
    this.#prefabViewer = new PrefabViewer(games.edit, this.#prefabContent);
    this.#assistant = new Assistant(games.edit, this.#assistantContent);
  }

  setup(ui: InspectorUI): void {
    const switchTab = (tabId: string) => {
      const tabs = Array.from(this.#container.querySelectorAll(".bottom-tab"));
      for (const tab of tabs) {
        if (!(tab instanceof HTMLElement)) continue;

        const isActive = tab.getAttribute("data-tab-id") === tabId;
        if (isActive) tab.setAttribute("data-active", "");
        else tab.removeAttribute("data-active");
      }
      // tabs.forEach(tab => {
      //   i
      //   if (tab instanceof HTMLElement) {
      //     tab
      //     // tab.classList.toggle("active", tab.getAttribute("data-tab-id") === tabId);
      //   }
      // });

      this.#logContent.style.display = tabId === "logs" ? "flex" : "none";
      this.#prefabContent.style.display = tabId === "prefabs" ? "flex" : "none";
      this.#assistantContent.style.display = tabId === "assistant" ? "flex" : "none";
    };

    const logsTab = elem("div", { className: "bottom-tab" });
    logsTab.setAttribute("data-tab-id", "logs");
    logsTab.append(icon(Terminal), elem("span", {}, ["Logs"]));

    const prefabsTab = elem("div", { className: "bottom-tab" });
    prefabsTab.setAttribute("data-tab-id", "prefabs");
    prefabsTab.append(icon(Box), elem("span", {}, ["Prefabs"]));

    const assistantTab = elem("div", { className: "bottom-tab" });
    assistantTab.setAttribute("data-tab-id", "assistant");
    assistantTab.setAttribute("data-active", "");
    assistantTab.append(icon(Bot), elem("span", {}, ["Assistant"]));

    const externalTab = elem("div", { className: "bottom-tab" });
    externalTab.setAttribute("data-tab-id", "external");
    externalTab.append(icon(Wand), elem("span", {}, ["Generate Asset"]));
    externalTab.addEventListener("click", () => {
      if (ui.game.instanceId === NIL_UUID)
        window.open("https://app.dreamlab.gg/create/asset", "_blank", "noopener,noreferrer");
      else window.parent.postMessage({ type: "SHOW_ASSET_CREATOR" }, "*");
    });

    const tabBar = elem("div", { className: "bottom-tabs-bar" }, [
      assistantTab,
      prefabsTab,
      logsTab,
      externalTab,
    ]);

    logsTab.addEventListener("click", () => {
      logsTab.style.removeProperty("background-color");
      logsTab.style.removeProperty("color");
    });

    tabBar.addEventListener("click", e => {
      const tab = (e.target as HTMLElement).closest(".bottom-tab");
      if (tab && tab instanceof HTMLElement) {
        const tabId = tab.getAttribute("data-tab-id");
        if (tabId && tabId !== "external") switchTab(tabId);
      }
    });

    const content = elem("div", { className: "bottom-tabs-content" }, [
      this.#logContent,
      this.#prefabContent,
      this.#assistantContent,
    ]);

    this.#prefabContent.style.display = "none";
    this.#assistantContent.style.display = "flex";
    this.#logContent.style.display = "none";
    this.#container.append(tabBar, content);

    this.#logViewer.setup(ui);
    this.#prefabViewer.setup(ui);
    this.#assistant.setup(ui);
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
