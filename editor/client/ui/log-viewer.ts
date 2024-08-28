import { ClientGame } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
// @deno-types="npm:@types/object-inspect@1.13.0"
import inspect from "npm:object-inspect@1.13.2";
import { WebSocket } from "npm:partysocket@1.0.2";
import stripAnsi from "npm:strip-ansi@7.1.0";
import type { LogEntry } from "../../../multiplayer/server-host/util/log-store.ts";
import { Activity, CaseSensitive, Grid2X2, icon, Trash2 as Trash, Unplug } from "../_icons.ts";
import { SERVER_URL } from "../util/server-url.ts";
import { InspectorUI } from "./inspector.ts";

type LogMessage = { t: "New"; entry: LogEntry };

export class LogViewer {
  #section = elem("section", { id: "log-viewer" });
  #logcontent = elem("div", { id: "log-content" });
  #logs: HTMLElement[] = [];

  #ws: WebSocket;

  constructor(
    private uiRoot: HTMLElement,
    private games: { edit: ClientGame; play?: ClientGame },
  ) {
    const url = new URL(SERVER_URL);
    url.pathname = `/api/v1/log-stream/${this.games.edit.instanceId}`;
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    this.#ws = new WebSocket(url.toString());
  }

  setup(_ui: InspectorUI): void {
    const sizeToggle = elem("p", { role: "button", id: "size-toggle" }, ["Expand"]);
    sizeToggle.addEventListener("click", () => {
      const layout = document.querySelector("#layout")!;
      const expanded = layout.classList.toggle("expand-logs");
      sizeToggle.innerText = expanded ? "Collapse" : "Expand";
    });

    const toggleGrid = elem("div", { role: "button" }, [icon(Grid2X2)]);
    const toggleCaseSens = elem("div", { role: "button" }, [icon(CaseSensitive)]);
    const filter = elem("input", { type: "search", placeholder: "Filter" });
    const clearLogs = elem("div", { role: "button", title: "Clear Logs" }, [icon(Trash)]);

    const updateFilters = () => {
      const query = filter.value;

      for (const log of this.#logs) {
        delete log.dataset.filtered;

        const caseSensitive = toggleCaseSens.dataset.active !== undefined;
        const text = log.textContent ?? "";

        const matches =
          query === ""
            ? true
            : caseSensitive
              ? text.includes(query)
              : text.toLowerCase().includes(query.toLowerCase());

        if (!matches) log.dataset.filtered = "";
      }
    };

    toggleGrid.addEventListener("click", () => {
      if (toggleGrid.dataset.active !== undefined) delete toggleGrid.dataset.active;
      else toggleGrid.dataset.active = "";

      if (this.#logcontent.dataset.grid !== undefined) delete this.#logcontent.dataset.grid;
      else this.#logcontent.dataset.grid = "";
    });

    toggleCaseSens.addEventListener("click", () => {
      if (toggleCaseSens.dataset.active !== undefined) delete toggleCaseSens.dataset.active;
      else toggleCaseSens.dataset.active = "";

      updateFilters();
    });

    clearLogs.addEventListener("click", () => {
      this.clearLogs();
    });

    filter.addEventListener("input", () => {
      updateFilters();
    });

    const connected = elem("div", { id: "connected" }, ["Connected", icon(Activity)]);
    const disconnected = elem("div", { id: "disconnected" }, ["Disconnected", icon(Unplug)]);
    const status = elem("div", { id: "log-status" }, [connected, disconnected]);

    const toolbar = elem("div", { id: "log-toolbar" }, [
      elem("div", {}, [elem("h1", {}, ["Logs"]), sizeToggle]),
      elem("div", {}, [toggleGrid, toggleCaseSens, filter, clearLogs]),
      status,
    ]);

    this.#section.append(toolbar, this.#logcontent);

    this.#ws.addEventListener("open", () => {
      this.clearLogs();
      status.dataset.connected = "";
    });

    this.#ws.addEventListener("close", () => {
      delete status.dataset.connected;
    });

    this.#ws.addEventListener("message", ev => {
      if (typeof ev.data !== "string") {
        console.warn("log streaming only supports text messages");
        return;
      }

      const message = JSON.parse(ev.data) as LogMessage;
      if (message.t === "New") this.appendLogEntry(message.entry);
    });

    const bottom = this.uiRoot.querySelector("#bottom-bar")!;
    bottom.append(this.#section);

    this.injectConsoleWrapper();
  }

  private injectConsoleWrapper() {
    const log = console.log;
    // TODO: wrap console.warn
    // TODO: wrap console.error

    console.log = (...args) => {
      const message = args
        .map(arg => {
          if (typeof arg === "string") return arg;
          if (typeof arg === "number") return arg.toString();
          if (typeof arg === "boolean") return arg.toString();

          return inspect(arg, { quoteStyle: "double" });
        })
        .join(" ");

      this.appendLogEntry({
        level: "info",
        timestamp: Date.now(),
        message,
        detail: {},
      });

      return log(...args);
    };
  }

  private appendLogEntry(log: LogEntry): void {
    const ts = new Date(log.timestamp).toISOString().replace("T", " ").replace("Z", "");
    const level = log.level.toUpperCase().padEnd(5, " ");

    const entry = elem("div", { className: "log-entry" }, [
      elem("code", {}, [ts]),
      elem("code", {}, [level]),
      ...this.logMessage(log),
    ]);

    this.#logs.push(entry);
    this.#logcontent.prepend(entry);
  }

  private logMessage(log: LogEntry): HTMLElement[] {
    const elements: HTMLElement[] = [elem("code", {}, [stripAnsi(log.message)])];

    if (log.detail !== undefined) {
      for (const [key, value] of Object.entries(log.detail)) {
        elements.push(
          elem("code", {}, [
            elem("i", {}, [key]),
            "=",
            inspect(value, { quoteStyle: "double" }),
          ]),
        );
      }
    }

    // function ansiToHtml(str: string): string {
    //   const colors: { [key: string]: string } = {
    //     "30": "var(--text-secondary-color)",
    //     "31": "var(--accent-red-color)",
    //     "32": "var(--accent-green-color)",
    //     "33": "var(--accent-yellow-color)",
    //     "34": "var(--accent-primary-color)",
    //     "35": "var(--accent-secondary-color)",
    //     "36": "var(--accent-green-color)",
    //     "37": "var(--text-primary-color)",
    //     "90": "var(--text-secondary-color)",
    //   };

    //   return str.replace(/\x1b\[(\d+)m/g, (_, code) => {
    //     const color = colors[code];
    //     if (color) {
    //       return `<span style="color: ${color};">`;
    //     } else if (code === "0") {
    //       return "</span>";
    //     }
    //     return "";
    //   });
    // }

    // TODO: convert ANSI escape codes
    // i dont think its possible for the logs to contain ansi so i am not bothering for now
    // if i am wrong please give me a test case and i'll fix it :3

    return elements;
  }

  private clearLogs() {
    for (const log of this.#logs) {
      log.remove();
    }

    this.#logs = [];
    window.parent.postMessage("log-viewer:clear");
  }
}
