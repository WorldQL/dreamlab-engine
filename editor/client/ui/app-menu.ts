import { ClientGame, PlayerJoined, PlayerLeft } from "@dreamlab/engine";
import { InspectorUI, InspectorUIComponent, renderInspector } from "./inspector.ts";
import { element as elem } from "@dreamlab/ui";
import { Ping } from "../networking/ping.ts";
import { connectToGame } from "../game-connection.ts";
import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { setupGame } from "../game-setup.ts";
import { games } from "../main.ts";

async function startPlayGame(playUIRoot: HTMLElement, game: ClientGame): Promise<ClientGame> {
  const playContainer = playUIRoot.querySelector("#game-container")! as HTMLDivElement;

  const connectURL = new URL(`ws://127.0.0.1:8000/api/v1/connect/${game.instanceId}`);
  const player = game.network.connections.find(c => c.id === game.network.self)!;
  // TODO: replace with token
  connectURL.searchParams.set("player_id", player.playerId);
  connectURL.searchParams.set("nickname", player.nickname);
  connectURL.searchParams.set("play_session", "1");

  const playSocket = new WebSocket(connectURL);
  playSocket.binaryType = "arraybuffer";

  const [playGame, conn, _handshake] = await connectToGame(
    game.instanceId,
    playContainer,
    playSocket,
    DEFAULT_CODEC,
  );
  games.play = playGame;

  await setupGame(playGame, conn, false);
  renderInspector(playGame, playUIRoot, playContainer, false);

  return playGame;
}

const editUIRoot = document.querySelector("main.edit-mode")! as HTMLElement;
const playUIRoot = document.querySelector("main.play-mode")! as HTMLElement;

export class AppMenu implements InspectorUIComponent {
  constructor(private game: ClientGame) {}

  render(ui: InspectorUI, uiRoot: HTMLElement): void {
    const topBar = uiRoot.querySelector("#top-bar")!;

    const saveButton = elem("a", { role: "button" }, ["Save"]);

    const playButton = elem("a", { role: "button", href: "javascript:void(0)" }, ["Play"]);
    playButton.addEventListener("click", async event => {
      event.preventDefault();

      if (games.play === undefined) {
        await startPlayGame(playUIRoot, this.game);
      }

      editUIRoot.style.display = "none";
      playUIRoot.style.display = "grid";

      if (games.play) games.play.renderer.app.resize();
    });

    const editButton = elem("a", { role: "button", href: "javascript:void(0)" }, ["Edit"]);
    editButton.addEventListener("click", event => {
      event.preventDefault();
      editUIRoot.style.display = "grid";
      playUIRoot.style.display = "none";
    });

    topBar.append(
      elem("section", { id: "app-menu" }, [
        elem("div", {}, [elem("h1", {}, ["Dreamlab"]), saveButton]),
        elem("div", {}, [playButton, editButton]),
        elem("div", {}, [this.renderStats(ui, uiRoot)]),
      ]),
    );
  }

  renderStats(_ui: InspectorUI, _editUIRoot: HTMLElement): HTMLElement {
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
}
