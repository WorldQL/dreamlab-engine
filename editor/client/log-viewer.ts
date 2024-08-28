import { ClientGame } from "../../engine/game.ts";

export function setupLogviewer(games: { edit: ClientGame; play?: ClientGame }) {
  const logControls = document.querySelector("#log-controls")!;
  const logOutput = document.querySelector("#log-output")!;
  const filterField: HTMLInputElement = logControls.querySelector("input[type=search]")!;

  document.getElementById("logs-expand")?.addEventListener("click", () => {
    const mainElement = document.querySelector("main");
    if (!mainElement) return;
    const text = document.getElementById("logs-expand")?.innerText;
    if (!document.getElementById("logs-expand")) return;
    if (text === "Expand") {
      mainElement.style.gridTemplateRows = "3em 12fr minmax(0, 8fr)";
      document.getElementById("logs-expand")!.innerText = "Collapse";
    } else if (text === "Collapse") {
      mainElement.style.gridTemplateRows = "3em 12fr minmax(0, 1fr)";
      document.getElementById("logs-expand")!.innerText = "Expand";
    }
    games.edit.renderer.app.resize();
    games.play?.renderer.app.resize();
  });

  function ansiToHtml(str: string): string {
    const colors: { [key: string]: string } = {
      "30": "var(--text-secondary-color)",
      "31": "var(--accent-red-color)",
      "32": "var(--accent-green-color)",
      "33": "var(--accent-yellow-color)",
      "34": "var(--accent-primary-color)",
      "35": "var(--accent-secondary-color)",
      "36": "var(--accent-green-color)",
      "37": "var(--text-primary-color)",
      "90": "var(--text-secondary-color)",
    };

    return str.replace(/\x1b\[(\d+)m/g, (_, code) => {
      const color = colors[code];
      if (color) {
        return `<span style="color: ${color};">`;
      } else if (code === "0") {
        return "</span>";
      }
      return "";
    });
  }

  function addLogEntry(date: Date, level: string, message: string) {
    const timestamp = date.toISOString().replace("T", " ").replace("Z", "");
    const article = document.createElement("article");
    article.className = level;
    article.appendChild(
      Object.assign(document.createElement("time"), {
        timestamp: date,
        textContent: timestamp,
      }),
    );
    article.appendChild(
      Object.assign(document.createElement("div"), {
        className: "level",
        textContent: level,
      }),
    );
    const messageElement = document.createElement("div");
    messageElement.className = "message";
    messageElement.innerHTML = ansiToHtml(message);
    article.appendChild(messageElement);
    const filterQuery = filterField.value;
    article.setAttribute("data-matches", String(message.includes(filterQuery)));
    logOutput.append(article);
  }

  (window as any).addLogEntry = addLogEntry;

  let caseSensitive = false;

  const caseSensitiveBtn = document.querySelector("#case-sensitive-btn")!;
  caseSensitiveBtn.addEventListener("click", () => {
    caseSensitive = !caseSensitive;
    caseSensitiveBtn.classList.toggle("active", caseSensitive);
    filterField.dispatchEvent(new Event("input"));
  });

  filterField.addEventListener("input", () => {
    const filterQuery = filterField.value;
    // @ts-expect-error wrong
    for (const child of logOutput.children) {
      if (child.tagName !== "ARTICLE") continue;
      const messageText = child.querySelector(".message")?.textContent ?? "";
      const matches = caseSensitive
        ? messageText.includes(filterQuery)
        : messageText.toLowerCase().includes(filterQuery.toLowerCase());
      child.setAttribute("data-matches", String(matches));
    }
  });

  const toggleGridBtn = document.querySelector("#toggle-grid-btn");
  toggleGridBtn?.addEventListener("click", () => {
    logOutput.classList.toggle("show-grid");
    toggleGridBtn.classList.toggle("active");
  });

  const clearLogsBtn = document.querySelector("#clear-logs-btn");
  clearLogsBtn?.addEventListener("click", () => {
    logOutput.innerHTML = "";
    window.parent.postMessage("log-viewer:clear");
  });

  window.addEventListener("message", event => {
    if (event.data === "dark-theme") {
      document.body.classList.add("dark-theme");
      document.documentElement.classList.add("dark-theme");
    } else if (event.data === "light-theme") {
      document.body.classList.remove("dark-theme");
      document.documentElement.classList.remove("dark-theme");
    }
  });

  const searchParams = new URLSearchParams(window.location.search);
  const server = searchParams.get("server");
  const connectURL = server + "api/v1/log-stream/" + searchParams.get("instance");

  const connect = connectURL;
  if (connect === null) {
    logControls.querySelector("#status")!.textContent = "Failed: no connect URL specified";
  } else {
    let retries = 0;
    const setupSocket = (socket: WebSocket) => {
      retries++;
      const timeout = setTimeout(() => {
        retries -= 1;
      }, 30_000);

      socket.addEventListener("open", () => {
        logOutput.innerHTML = "";
        logControls.querySelector("#status")!.textContent = "Connected";
        (logControls.querySelector("#status") as HTMLSpanElement).style.color =
          "var(--accent-green-color)";
      });

      socket.addEventListener("message", event => {
        const data = event.data;
        if (typeof data !== "string") return;
        const packet = JSON.parse(data);
        if (!(typeof packet === "object" && "t" in packet)) return;

        if (packet.t === "New" && "entry" in packet) {
          const { level, timestamp, message, detail } = packet.entry;
          const date = new Date(timestamp);
          let formattedMessage = message;

          if (detail !== undefined) {
            for (const [key, value] of Object.entries(detail)) {
              formattedMessage += ` ${key}=${JSON.stringify(value)}`;
            }
          }
          addLogEntry(date, level, formattedMessage);
        }
      });

      socket.addEventListener("close", () => {
        clearTimeout(timeout);

        logControls.querySelector("#status")!.textContent = "Disconnected";
        (logControls.querySelector("#status") as HTMLSpanElement).style.color =
          "var(--accent-red-color)";

        if (retries < 5) {
          const newSocket = new WebSocket(connect);
          setupSocket(newSocket);
        } else {
          console.warn("detected reconnect loop! aborting");
        }
      });
    };

    const socket = new WebSocket(connect);
    setupSocket(socket);
  }
}
