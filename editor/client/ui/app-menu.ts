import { ClientGame, PlayerJoined, PlayerLeft } from "@dreamlab/engine";
import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { element as elem } from "@dreamlab/ui";
import { ArrowUpDown, Hammer, icon, OctagonX, Play, Save, User } from "../_icons.ts";
import { IconButton } from "../components/mod.ts";
import { connectToGame } from "../game-connection.ts";
import { setupGame } from "../game-setup.ts";
import { Ping } from "../networking/ping.ts";
import { InspectorUI } from "./inspector.ts";

export class AppMenu {
  #section = elem("section", { id: "app-menu" });

  playInspector: InspectorUI | undefined;

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

    saveButton.addEventListener("click", () => {
          // TODO: save logic
          // I was going to implement this but could not find the code responsible for generating a project.json
          // I searched the whole codebase for "schema_version" in hopes of finding it but no dice.
          // Are the example ones handwritten? 
    });

    const playButton = new IconButton(Play, {
      id: "play-button",
      title: "Play",
      ariaLabel: "Play",
    });
    playButton.addEventListener("click", async event => {
      event.preventDefault();

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
    });

    const editButton = new IconButton(Hammer, {
      id: "edit-button",
      title: "Edit",
      ariaLabel: "Edit",
    });
    editButton.addEventListener("click", event => {
      event.preventDefault();

      this.playInspector?.hide();
      if (this.games.play) this.games.play.container.style.display = "none";

      editUI.show(this.uiRoot);
      this.games.edit.container.style.display = "block";

      // TODO: hide current playUI
    });

    const stopButton = new IconButton(OctagonX, {
      id: "stop-button",
      title: "Stop",
      ariaLabel: "Stop",
    });

    stopButton.addEventListener("click", event => {
      event.preventDefault();
      void this.#stopPlayGame();
    });

    this.#section.append(
      elem("div", {}, [elem("h1", {}, ["Dreamlab"]), saveButton]),
      elem("div", {}, [playButton, editButton, stopButton]),
      elem("div", {}, [this.setupStats(this.games.edit)]),
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

    const connectURL = new URL(import.meta.env.SERVER_URL);
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
    if (!this.games.play) return;
    const url = new URL(import.meta.env.SERVER_URL);
    url.pathname = `/api/v1/stop-play-session/${this.games.play.instanceId}`;
    await fetch(url, { method: "POST" });
  }
}
