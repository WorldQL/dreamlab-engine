import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import { ClientGame } from "@dreamlab/engine";
import { urlToHTTP } from "@dreamlab/util/url.ts";
import { InspectorUI } from "../inspector.ts";

export class Assistant {
  game: ClientGame;
  container: HTMLElement;
  ui: InspectorUI | undefined;
  isPro: boolean;

  constructor(game: ClientGame, container: HTMLElement, isPro: boolean) {
    this.game = game;
    this.container = container;
    this.isPro = isPro;
  }

  setup(ui: InspectorUI) {
    this.ui = ui;

    const httpServer = urlToHTTP(connectionDetails.serverUrl);
    const serviceId = encodeURIComponent(this.game.worldId);

    try {
      const coderBaseUrl = new URL("coder-manager", httpServer).toString();

      const chatbotUIUrl = coderBaseUrl.includes("localhost")
        ? "http://localhost:5177"
        : "https://ai-chatbot.dreamlab.gg/";

      const iframeUrl = `${chatbotUIUrl}/?directory=${decodeURIComponent(
        serviceId,
      )}&baseUrl=${coderBaseUrl}&isPro=${this.isPro}`;

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
