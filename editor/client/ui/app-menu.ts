import { ClientGame, PlayerJoined, PlayerLeft } from "@dreamlab/engine";
import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { element as elem } from "@dreamlab/ui";
import {
  ArrowUpDown,
  Box,
  GitCompareArrows,
  Hammer,
  icon,
  OctagonX,
  Play,
  Save,
  ScrollText,
  User,
} from "../_icons.ts";
import { IconButton } from "../components/mod.ts";
import { connectToGame } from "../game-connection.ts";
import { setupGame } from "../game-setup.ts";
import { Ping } from "../networking/ping.ts";
import { SERVER_URL } from "../util/server-url.ts";
import { InspectorUI } from "./inspector.ts";

export class AppMenu {
  #section = elem("section", { id: "app-menu" });

  playInspector: InspectorUI | undefined;
  private controls: Record<string, IconButton> = {};
  private navigation: Record<string, IconButton> = {};

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

    saveButton.addEventListener("click", async () => {
      const url = new URL(SERVER_URL);
      url.pathname = `/api/v1/save-edit-session/${this.games.edit.instanceId}`;
      await fetch(url, { method: "POST" });
      // TODO: toast or something when the save goes through
    });

    this.controls = {
      play: new IconButton(Play, {
        id: "play-button",
        title: "Play",
        ariaLabel: "Play",
      }),
      edit: new IconButton(Hammer, {
        id: "edit-button",
        title: "Return to Edit (without stopping server)",
        ariaLabel: "Return to Editor",
      }),
      stop: new IconButton(OctagonX, {
        id: "stop-button",
        title: "Stop",
        ariaLabel: "Stop",
      }),
    };

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
    this.controls.play.enable();
    this.controls.edit.disable();
    this.controls.stop.disable();

    this.navigation.script.addEventListener("click", event => {
      event.preventDefault();
      window.parent.postMessage({ action: "goToTab", tab: "scripts" }, "*");
    });

    this.navigation.source.addEventListener("click", event => {
      event.preventDefault();
      window.parent.postMessage({ action: "goToTab", tab: "source-control" }, "*");
    });

    this.controls.play.addEventListener("click", async event => {
      event.preventDefault();
      this.controls.stop.enable();

      // TODO: if someone spams this button we should still only connect once
      if (this.games.play === undefined) {
        await this.#connectToPlayGame(editUI);
      }

      editUI.hide();
      this.games.edit.container.style.display = "none";

      this.playInspector?.show(this.uiRoot);
      if (this.games.play) {
        this.games.play.container.style.display = "block";
        this.games.play.renderer.app.resize();
      }

      // TODO: Fix enabling / disabling these buttons based on actual server game state
      // this is so that we can always join the other session
      // this.controls.play.disable();
      this.controls.edit.enable();
    });

    this.controls.edit.addEventListener("click", event => {
      event.preventDefault();

      this.playInspector?.hide();
      if (this.games.play) this.games.play.container.style.display = "none";

      editUI.show(this.uiRoot);
      this.games.edit.container.style.display = "block";
      this.games.edit.renderer.app.resize();

      this.controls.edit.disable();
      this.controls.play.enable();
      this.controls.stop.enable();
    });

    this.controls.stop.addEventListener("click", async event => {
      event.preventDefault();

      await this.#stopPlayGame();

      this.controls.stop.disable();
      this.controls.edit.disable();
      this.controls.play.enable();
    });

    this.#section.append(
      elem("div", {}, Object.values(this.navigation)),
      elem("div", {}, Object.values(this.controls)),
      elem("div", {}, [this.setupStats(this.games.edit), saveButton]),
    );

    const topBar = this.uiRoot.querySelector("#top-bar")!;
    topBar.append(this.#section);
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

    const connectURL = new URL(SERVER_URL);
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
    );

    playSocket.addEventListener("close", () => {
      if (this.games.play === playGame) this.games.play = undefined;
      playGame.container.remove();
      playGame.shutdown();
      this.playInspector?.hide();

      editUI.show(this.uiRoot);
      this.games.edit.container.style.display = "block";
      this.games.edit.renderer.app.resize();
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
    const url = new URL(SERVER_URL);
    // edit and play instanceIds match
    url.pathname = `/api/v1/stop-play-session/${this.games.edit.instanceId}`;
    await fetch(url, { method: "POST" });
  }
}
