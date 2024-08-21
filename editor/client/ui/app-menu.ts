import { ClientGame, PlayerJoined, PlayerLeft } from "@dreamlab/engine";
import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { element as elem } from "@dreamlab/ui";
import { connectToGame } from "../game-connection.ts";
import { setupGame } from "../game-setup.ts";
import { games } from "../main.ts";
import { Ping } from "../networking/ping.ts";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

// TODO: we should not create a whole new editor ui for the play game

async function startPlayGame(uiRoot: HTMLElement, game: ClientGame): Promise<ClientGame> {
  const container = uiRoot.querySelector("#game-container")! as HTMLDivElement;

  const connectURL = new URL(import.meta.env.SERVER_URL);
  connectURL.pathname = `/api/v1/connect/${game.instanceId}`;
  const player = game.network.connections.find(c => c.id === game.network.self)!;
  // TODO: replace with token
  connectURL.searchParams.set("player_id", player.playerId);
  connectURL.searchParams.set("nickname", player.nickname);
  connectURL.searchParams.set("play_session", "1");

  const playSocket = new WebSocket(connectURL);
  playSocket.binaryType = "arraybuffer";

  const [playGame, conn, _handshake] = await connectToGame(
    game.instanceId,
    container,
    playSocket,
    DEFAULT_CODEC,
  );

  playSocket.addEventListener("close", () => {
    if (games.play === playGame) games.play = undefined;
    playGame.container.innerHTML = "";
    playGame.shutdown();

    // TODO: hide play ui
  });

  await setupGame(playGame, conn, false);
  games.play = playGame;
  // TODO: setup & show an inspector for the playGame

  return playGame;
}

async function stopPlayGame(game: ClientGame) {
  const url = new URL(import.meta.env.SERVER_URL);
  url.pathname = `/api/v1/stop-play-session/${game.instanceId}`;
  await fetch(url, { method: "POST" });
}

const editUIRoot = document.querySelector("main")! as HTMLElement;

// TODO: this should not belong to the inspector, it should be its own thing
export class AppMenu implements InspectorUIWidget {
  #section = elem("section", { id: "app-menu" });

  constructor(private game: ClientGame) {}

  setup(editUI: InspectorUI): void {
    const playButton = elem("a", { role: "button", href: "javascript:void(0)" }, ["Play"]);
    playButton.addEventListener("click", async event => {
      event.preventDefault();

      if (games.play === undefined) {
        // TODO: startPlayGame(..)
      }

      editUI.hide();
      editUI.gameContainer.style.display = "none";

      if (games.play) games.play.renderer.app.resize();
    });

    const editButton = elem("a", { role: "button", href: "javascript:void(0)" }, ["Edit"]);
    editButton.addEventListener("click", event => {
      event.preventDefault();

      // TODO: hide current playUI
    });

    const stopButton = elem("a", { role: "button", href: "javascript:void(0)" }, ["Stop"]);
    stopButton.addEventListener("click", event => {
      event.preventDefault();
      stopPlayGame(this.game);
    });

    const saveButton = elem("a", { role: "button" }, ["Save"]);

    this.#section.append(
      elem("div", {}, [elem("h1", {}, ["Dreamlab"]), saveButton]),
      elem("div", {}, [playButton, editButton, stopButton]),
      elem("div", {}, [this.setupStats(editUI)]),
    );
  }

  setupStats(_ui: InspectorUI): HTMLElement {
    const countText = document.createTextNode("1");
    const updateCount = () => {
      const count = this.game.network.connections.length;
      countText.textContent = count.toLocaleString();
    };

    this.game.on(PlayerJoined, () => updateCount());
    this.game.on(PlayerLeft, () => updateCount());
    updateCount();

    const pingText = document.createTextNode("0");
    this.game.on(Ping, ({ ping }) => (pingText.textContent = ping.toLocaleString()));

    // TODO: make this look nice lol
    return elem("div", {}, [
      elem("div", {}, ["Connected Users: ", countText]),
      elem("div", {}, ["Ping: ", pingText, "ms"]),
    ]);
  }

  show(uiRoot: HTMLElement): void {
    const topBar = uiRoot.querySelector("#top-bar")!;
    topBar.append(this.#section);
  }

  hide(): void {
    this.#section.remove();
  }
}
