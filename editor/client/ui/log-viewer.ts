import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import { ClientGame } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { CSSProperties } from "@dreamlab/ui/css";
import { urlToWebSocket } from "@dreamlab/util/url.ts";
// @deno-types="npm:@types/object-inspect@1.13.0"
import inspect from "npm:object-inspect@1.13.2";
import { WebSocket } from "npm:partysocket@1.0.2";
import stripAnsi from "npm:strip-ansi@7.1.0";
import type { LogEntry } from "../../../multiplayer/common-host/log-store.ts";
import { Activity, CaseSensitive, Grid2X2, icon, Trash2 as Trash, Unplug } from "../_icons.tsx";
import { InspectorUI } from "./inspector.ts";

type LogMessage = { t: "New"; entry: LogEntry };

export class LogViewer {
  #section = elem("section", { id: "log-viewer" });
  #logcontent = elem("div", { id: "log-content" });
  #logs: HTMLElement[] = [];

  #ws: WebSocket;
  private maxLogs: number;

  constructor(
    private container: HTMLElement,
    private games: { edit: ClientGame; play?: ClientGame },
    maxLogs = 100, // Default maximum number of logs
  ) {
    const url = new URL(
      `/api/v1/log-stream/${this.games.edit.instanceId}`,
      urlToWebSocket(connectionDetails.serverUrl),
    );
    this.#ws = new WebSocket(url.toString());
    this.maxLogs = maxLogs;
  }

  setup(_ui: InspectorUI): void {
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
      elem("div", {}, [elem("h1", {}, ["Logs"])]),
      elem("div", {}, [toggleGrid, toggleCaseSens, filter, clearLogs]),
      status,
    ]);

    this.#section.append(
      toolbar,
      elem("div", { id: "log-content-wrapper" }, [this.#logcontent]),
    );

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

    this.container.append(this.#section);

    if (!localStorage.getItem("dreamlab_disable_console_hook")) {
      this.injectConsoleWrapper();
    }
  }

  private injectConsoleWrapper() {
    const log = console.log;
    const error = console.error;
    // TODO: wrap console.warn

    globalThis.addEventListener("error", ev => {
      this.appendLogEntry({
        level: "error",
        timestamp: Date.now(),
        message: `Uncaught ${ev.error}`,
        detail: {},
        source: "client",
      });
    });

    console.log = (...args) => {
      const message = args.join(" ");

      const stack = new Error().stack;
      if (!(stack?.includes("_dist_play") || stack?.includes("engine.js"))) {
        console.debug(...args);
        return;
      }

      this.appendLogEntry({
        level: "info",
        timestamp: Date.now(),
        message,
        detail: {},
        source: "client",
      });

      return log(...args);
    };

    console.error = (...args) => {
      const message = args.join(" ");

      const stack = new Error().stack;
      if (!(stack?.includes("_dist_play") || stack?.includes("engine.js"))) {
        console.debug(...args);
        return;
      }

      this.appendLogEntry({
        level: "error",
        timestamp: Date.now(),
        message,
        detail: {},
        source: "client",
      });

      return error(...args);
    };
  }

  private appendLogEntry(log: LogEntry): void {
    const ts = new Date(log.timestamp).toISOString().replace("T", " ").replace("Z", "");
    let level = log.level.toUpperCase().padEnd(5, " ");
    let className = "log-entry";

    const style: CSSProperties = {};
    if (log.source === "client") {
      level = "CLIENT".padEnd(5, " ");
      style.backgroundColor = "rgba(253, 255, 112, 0.2)";
    }

    if (log.level === "error") {
      className += " log-entry-error";
    }

    const entry = elem("div", { className, style }, [
      elem("code", { className: "no-select" }, [ts]),
      elem("code", { className: "no-select" }, [level]),
      ...this.logMessage(log),
    ]);

    this.#logs.push(entry);
    this.#logcontent.append(entry);

    // Remove old logs if we exceed the maximum
    if (this.#logs.length > this.maxLogs) {
      const oldEntry = this.#logs.shift();
      if (oldEntry) {
        oldEntry.remove();
      }
    }

    const logsTab = document.querySelector('[data-tab-id="logs"]') as HTMLDivElement;
    if (logsTab && !logsTab.hasAttribute("data-active")) {
      logsTab.classList.add("has-new");
    }
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
