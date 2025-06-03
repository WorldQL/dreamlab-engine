import { ClientGame } from "@dreamlab/engine";
import { InspectorUI } from "../inspector.ts";

let httpServer: string | undefined = undefined;

export class Assistant {
  game: ClientGame;
  container: HTMLElement;
  ui: InspectorUI | undefined;

  constructor(game: ClientGame, container: HTMLElement) {
    this.game = game;
    this.container = container;
  }

  setup(ui: InspectorUI) {
    this.ui = ui;

    const urlParams = new URLSearchParams(window.location.search);
    const websocketServer = urlParams.get("server");

    // Convert wss:// / ws:// to https:// / http:// for REST endpoints
    httpServer = websocketServer
      ? websocketServer.replace(/^wss:/, "https:").replace(/^ws:/, "http:")
      : undefined;

    if (!httpServer) {
      throw new Error(
        "could not infer http server from websocketServer. This should never throw.",
      );
    }

    const serviceId = encodeURIComponent(this.game.worldId);

    try {
      const coderBaseUrl = new URL("coder-manager", httpServer).toString();

      const chatbotUIUrl = coderBaseUrl.includes("localhost")
        ? "http://localhost:5177/"
        : "https://ai-chatbot.dreamlab.gg/";

      const iframeUrl = `${chatbotUIUrl}/?directory=${decodeURIComponent(serviceId)}&baseUrl=${coderBaseUrl}`;
      console.log(iframeUrl);

      // 5. Create an iframe to show that coder instance
      const iframe = document.createElement("iframe");
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.style.padding = "none";
      iframe.src = iframeUrl;

      // Clear the loading message and append the iframe
      this.container.innerHTML = "";
      this.container.appendChild(iframe);
    } catch {
      // do nothing
    }
  }
}
