import { connectToGame } from "@dreamlab/client/game-connection.ts";
import { setupGame } from "@dreamlab/client/game-setup.ts";
import { Ping } from "@dreamlab/client/networking/ping.ts";
import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import { ClientGame, PlayerJoined, PlayerLeft } from "@dreamlab/engine";
import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { element as elem } from "@dreamlab/ui";
import {
  ArrowUpDown,
  Box,
  Check,
  GitCompareArrows,
  Hammer,
  icon,
  MonitorPlay,
  OctagonX,
  Pause,
  Play,
  Save,
  ScrollText,
  User,
} from "../_icons.ts";
import { IconButton } from "../components/mod.ts";
import { InspectorUI } from "./inspector.ts";

export class AppMenu {
  #section = elem("section", { id: "app-menu" });

  playInspector: InspectorUI | undefined;
  private controls: Record<string, IconButton> = {};
  private navigation: Record<string, IconButton> = {};

  private playSessionState: { running: boolean; paused: boolean } = {
    running: false,
    paused: false,
  };
  private playFocused: boolean = false;

  constructor(
    private uiRoot: HTMLElement,
    private games: { edit: ClientGame; play?: ClientGame },
  ) {}

  setup(editUI: InspectorUI): void {
    const saveButton = new IconButton(Save, {
      id: "save-button",
      title: "Save",
      ariaLabel: "Save",
    });

    this.uiRoot.querySelector("#viewport")?.addEventListener("click", () => {
      // unfocus the active element when we click on the viewport.
      // fixes extremely annoying behavior where pressing space can toggle your last selected checkbox, etc.
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement) {
        activeElement.blur();
      }
    });

    // TODO: don't save if we know the scene hasn't changed
    const save = async () => {
      const url = new URL(connectionDetails.serverUrl);
      url.pathname = `/api/v1/save-edit-session/${this.games.edit.instanceId}`;

      const button = saveButton.querySelector("button")!;
      try {
        button.disabled = true;
        await fetch(url, { method: "POST" });

        button.style.backgroundColor = "rgb(var(--color-green) / 1)";
        saveButton.setIcon(Check);

        setTimeout(() => {
          button.style.backgroundColor = "";
          saveButton.setIcon(Save);
        }, 3000);
      } finally {
        button.disabled = false;
        window.parent.postMessage({ action: "reloadProject" }, "*");
      }
    };
    saveButton.addEventListener("click", save);

    this.controls = {
      play: new IconButton(MonitorPlay, {
        id: "play-button",
        title: "Test in a play session",
        ariaLabel: "Test in a play session",
      }),
      edit: new IconButton(Hammer, {
        id: "edit-button",
        title: "Return to Edit (without stopping server)",
        ariaLabel: "Return to Editor",
      }),
      pause: new IconButton(Pause, {
        id: "pause-button",
        title: "Pause",
        ariaLabel: "Pause",
      }),
      stop: new IconButton(OctagonX, {
        id: "stop-button",
        title: "Stop",
        ariaLabel: "Stop",
      }),
    };

    this.controls.play.addEventListener("click", async () => {
      if (!this.games.play) {
        await this.#connectToPlayGame(editUI);
      }

      this.playFocused = true;
      this.updateButtonStates();
      this.updateViewportStates(editUI);
    });
    this.controls.edit.addEventListener("click", () => {
      this.playFocused = false;
      this.updateButtonStates();
      this.updateViewportStates(editUI);
    });
    this.controls.pause.addEventListener("click", () => {
      if (this.games.play) {
        this.games.play.paused.value = !this.games.play.paused.value;
      }
    });
    this.controls.stop.addEventListener("click", async () => {
      this.playFocused = false;
      await this.#stopPlayGame();
    });

    this.navigation = {
      editor: new IconButton(Box, {
        id: "game-button",
        title: "Editor",
        ariaLabel: "Editor",
      }),
      script: new IconButton(ScrollText, {
        id: "script-button",
        title: "Go to Scripts",
        ariaLabel: "Go to Scripts",
      }),
      source: new IconButton(GitCompareArrows, {
        id: "source-button",
        title: "Go to Source Control",
        ariaLabel: "Go to Source Control",
      }),
    };

    this.navigation.editor.disable();

    this.navigation.script.addEventListener("click", event => {
      event.preventDefault();
      window.parent.postMessage({ action: "goToTab", tab: "scripts" }, "*");
    });

    this.navigation.source.addEventListener("click", event => {
      event.preventDefault();
      window.parent.postMessage({ action: "goToTab", tab: "source-control" }, "*");
    });

    this.#section.append(
      elem("div", {}, Object.values(this.navigation)),
      elem("div", {}, Object.values(this.controls)),
      elem("div", {}, [this.setupStats(this.games.edit), saveButton]),
    );

    const topBar = this.uiRoot.querySelector("#top-bar")!;
    topBar.append(this.#section);

    this.setupButtonStates();
    this.updateButtonStates();
  }

  setupStats(game: ClientGame): HTMLElement {
    const countText = document.createTextNode("1");
    const updateCount = () => {
      const count = game.network.connections.length;
      countText.textContent = count.toLocaleString();
    };

    game.on(PlayerJoined, () => updateCount());
    game.on(PlayerLeft, () => updateCount());
    updateCount();

    const pingText = document.createTextNode("0");
    game.on(Ping, ({ ping }) => (pingText.textContent = ping.toLocaleString()));

    // TODO: make this look nice lol
    return elem("div", { id: "stats" }, [
      elem("div", { id: "users", title: "Connected Users" }, [
        elem("span", {}, [countText]),
        icon(User),
      ]),
      elem("div", { id: "ping", title: "Ping" }, [
        elem("span", {}, [pingText, "ms"]),
        icon(ArrowUpDown),
      ]),
    ]);
  }

  async #connectToPlayGame(editUI: InspectorUI) {
    const container = document.createElement("div");
    this.uiRoot.querySelector("#viewport")!.append(container);

    const connectURL = new URL(connectionDetails.serverUrl);
    connectURL.pathname = `/api/v1/connect/${this.games.edit.instanceId}`;
    const player = this.games.edit.network.connections.find(
      c => c.id === this.games.edit.network.self,
    )!;
    // TODO: replace with token
    connectURL.searchParams.set("player_id", player.playerId);
    connectURL.searchParams.set("nickname", player.nickname);
    connectURL.searchParams.set("play_session", "1");

    const playSocket = new WebSocket(connectURL);
    playSocket.binaryType = "arraybuffer";

    const [playGame, conn, _handshake] = await connectToGame(
      this.games.edit.instanceId,
      container,
      playSocket,
      DEFAULT_CODEC,
      true,
    );

    playSocket.addEventListener("close", () => {
      this.playFocused = false;
      this.updateViewportStates(editUI);
      this.updateButtonStates();

      if (this.games.play === playGame) this.games.play = undefined;
      playGame.container.remove();
      playGame.shutdown();
    });

    await setupGame(playGame, conn, false);
    this.playInspector = new InspectorUI(playGame, conn, false, container);
    this.games.play = playGame;
  }

  #disconnectPlayGame() {
    if (!this.games.play) return;

    this.games.play.shutdown();
    this.games.play = undefined;
  }

  async #stopPlayGame() {
    // we need to be able to stop the server even if this.games.play is not created successfully.
    // if (!this.games.play) return;
    const url = new URL(connectionDetails.serverUrl);
    // edit and play instanceIds match
    url.pathname = `/api/v1/stop-play-session/${this.games.edit.instanceId}`;
    await fetch(url, { method: "POST" });
  }

  updateViewportStates(editUI: InspectorUI) {
    if (this.playFocused) {
      editUI.hide();
      this.playInspector?.show(this.uiRoot);

      if (this.games.play) {
        this.games.play.container.style.display = "block";
        this.games.play.renderer.app.resize();
      }
      this.games.edit.container.style.display = "none";
    } else {
      editUI.show(this.uiRoot);
      this.playInspector?.hide();

      if (this.games.play) {
        this.games.play.container.style.display = "none";
      }
      this.games.edit.container.style.display = "block";
      this.games.edit.renderer.app.resize();
    }
  }

  updateButtonStates() {
    const { running, paused } = this.playSessionState;
    const playFocused = this.playFocused;

    if (running) this.#section.dataset.playRunning = "";
    else delete this.#section.dataset.playRunning;

    if (paused) this.#section.dataset.paused = "";
    else delete this.#section.dataset.paused;

    if (playFocused) this.#section.dataset.playFocused = "";
    else delete this.#section.dataset.playFocused;

    const { edit, play, pause, stop } = this.controls;

    if (playFocused) {
      edit.enable();
      play.disable();
      stop.enable();
      pause.enable();
    } else {
      play.enable();
      edit.disable();
      pause.disable();
    }

    if (paused) {
      pause.setIcon(Play);
      pause.className = "resume";
      pause.setAttrs({
        title: "Resume",
        ariaLabel: "Resume",
      });
    } else {
      pause.setIcon(Pause);
      pause.className = "";
      pause.setAttrs({
        title: "Pause",
        ariaLabel: "Pause",
      });
    }

    if (running) {
      stop.enable();
    } else {
      stop.disable();
    }
  }

  setupButtonStates() {
    this.games.edit.network.onReceiveCustomMessage((from, channel, data) => {
      if (channel !== "edit:play-session") return;
      if (from !== "server") return;
      this.playSessionState = data as typeof this.playSessionState;
      this.updateButtonStates();
    });
    this.games.edit.network.sendCustomMessage("server", "edit:play-session", {});
  }
}
