import { ClientGame } from "@dreamlab/engine";
import { InspectorUI } from "../inspector.ts";

/**
 * Tracks session-related info (URLs, instance IDs, chat context, etc.).
 */
export class ScriptSession {
  public static chatContext: ChatbotContext = [];
  public static chatState: "plan" | "step1" | "step2" | "followup" = "plan";
  public static chatDocumentation: string = "";
  public static httpServer: string; // e.g. "https://example.com/"
  public static instance: string; // e.g. "alpha"
  public static scriptMap: string;
}

/**
 * Represents a single conversation item within the chatbot context.
 */
export interface ContextItem {
  role: "user" | "assistant";
  content: string;
}
export type ChatbotContext = ContextItem[];

/**
 * The Assistant class sets up a "coder" environment (a service) for a given game session.
 * - Checks if a service is running for the session ID (derived from game.worldId).
 * - If not, spawns the service.
 * - Shows an iframe to connect to that service.
 * - Sends heartbeats to keep the service alive.
 */
export class Assistant {
  game: ClientGame;
  container: HTMLElement;
  ui: InspectorUI | undefined;

  // We'll store the interval ID for heartbeats here so we can clear it if needed.
  private heartbeatIntervalId: number | null = null;

  constructor(game: ClientGame, container: HTMLElement) {
    this.game = game;
    this.container = container;

    // This logs out the unique world/session ID from the game engine
    // which we'll use as the ID for our coder.
    console.log("Game worldId:", game.worldId);
  }

  /**
   * Called to set up the Assistant UI. We'll:
   * 1. Parse URL params for the server & instance name.
   * 2. Store them in ScriptSession.
   * 3. Check if a coder service is already running for this worldId.
   * 4. If not, spawn it.
   * 5. Wait until the service is ready (initial delay + polling)
   * 6. Create an <iframe> to show that coder instance.
   * 7. Send heartbeats every 30 seconds.
   */
  setup(ui: InspectorUI) {
    this.ui = ui;

    const urlParams = new URLSearchParams(window.location.search);
    const websocketServer = urlParams.get("server");
    const instance = urlParams.get("instance");

    // Convert wss:// / ws:// to https:// / http:// for REST endpoints
    const httpServer = websocketServer
      ? websocketServer.replace(/^wss:/, "https:").replace(/^ws:/, "http:")
      : null;

    ScriptSession.httpServer = httpServer || "";
    ScriptSession.instance = instance || "";

    console.log("Using HTTP server:", ScriptSession.httpServer);

    // We'll do everything asynchronously inside an IIFE
    // so we can await fetch calls without making `setup` itself async.
    (async () => {
      // If the user’s worldId can include slashes, we should encode it
      // when constructing paths on the server.
      const serviceId = encodeURIComponent(this.game.worldId);

      // Base URL for our coder-manager endpoints
      const baseUrl =
        globalThis.env.DREAMLAB_CODE_EDITOR_CODER_MANAGER_BASE ||
        new URL("coder-manager", ScriptSession.httpServer).toString();

      // Show a loading message while we work
      this.container.innerHTML = "Loading coder environment...";

      try {
        // 1. Check if a service is already running for this ID
        const checkResp = await fetch(`${baseUrl}/service/${serviceId}`);
        if (!checkResp.ok) {
          throw new Error(`Service check failed with status ${checkResp.status}`);
        }
        const checkData = await checkResp.json();
        let port = checkData.port;

        if (!checkData.exists) {
          // 2. If service doesn't exist, spawn it
          // Use instance as the cwd if available, else fallback to "."
          const spawnBody = {
            cwd: this.game.worldId,
            id: decodeURIComponent(serviceId), // decode back for the server
          };
          const spawnResp = await fetch(`${baseUrl}/spawn`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(spawnBody),
          });
          if (!spawnResp.ok) {
            throw new Error(`Spawn failed with status ${spawnResp.status}`);
          }
          const spawnData = await spawnResp.json();
          port = spawnData.port;
        }

        // 3. Build the iframe URL

        const coderBaseUrl =
          globalThis.env.DREAMLAB_CODE_EDITOR_CODER_BASE ||
          new URL("coder", ScriptSession.httpServer).toString();

        const iframeUrl = `${coderBaseUrl}/${port}/${decodeURIComponent(serviceId)}`;

        // 4. Wait 500ms and then poll until the service is ready (i.e., not returning 502)
        await this.waitForServiceReady(iframeUrl);

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

        // Example: 5 seconds after loading, send a postMessage to the iframe
        // setTimeout(() => {
        //   console.log("Sending postMessage to the iframe...");
        //   iframe.contentWindow?.postMessage({ type: "autoFill", text: "Extra text:" }, "*");
        // }, 5000);

        // 6. Start sending heartbeats every 30 seconds
        this.startHeartbeat(decodeURIComponent(serviceId));
      } catch (err) {
        console.error("Failed to load or spawn coder environment:", err);
        this.container.innerHTML =
          "Failed to load or spawn coder environment. See console for details.";
        this.container.style.cssText = `
          background: rgb(var(--color-bg-1));
          padding: 10px
        `;
      }
    })();
  }

  /**
   * Polls the given URL until it returns a status other than 502.
   * Starts with an initial 500ms delay before polling.
   * Uses GET instead of HEAD to avoid CORS issues.
   * @param url - The URL to poll.
   */
  private async waitForServiceReady(url: string): Promise<void> {
    // Initial delay of 500ms
    await new Promise(resolve => setTimeout(resolve, 500));

    while (true) {
      try {
        // Using GET to check if the service is ready
        const response = await fetch(url, { method: "GET" });
        if (response.status !== 502) {
          break; // Service is ready
        }
      } catch (error) {
        // If fetch fails, we assume the service is not ready yet.
      }
      // Wait 500ms before polling again
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Sends a heartbeat to keep the session alive every 30 seconds.
   */
  private startHeartbeat(serviceId: string) {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
    const baseUrl =
      globalThis.env.DREAMLAB_CODE_EDITOR_CODER_MANAGER_BASE ||
      new URL("coder-manager", ScriptSession.httpServer);

    this.heartbeatIntervalId = globalThis.setInterval(async () => {
      try {
        // We'll POST { id: serviceId } to /heartbeat
        await fetch(`${baseUrl}/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: serviceId }),
        });
        // If we wanted to log success, we could do so here:
        // console.log("Heartbeat success for", serviceId);
      } catch (err) {
        console.warn("Heartbeat request failed:", err);
      }
    }, 30_000);
  }
}
