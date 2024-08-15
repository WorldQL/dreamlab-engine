import "../../editor/common/mod.ts";

import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { NIL_UUID } from "jsr:@std/uuid@1/constants";
import { renderEditorUI } from "./editor/editor-ui-main.tsx";
import { preloadFonts } from "./fonts.ts";
import { ClientConnection } from "./networking/net-connection.ts";
import { _setGlobalGames, GlobalGames } from "./editor/context/game-context.ts";
import { connectToGame } from "./game-connection.ts";
import { setupGame } from "./game-setup.ts";

const fonts = preloadFonts({
  families: ["Inter", "Iosevka"],
  styles: ["normal"],
  weights: ["400", "500"],
});

// TODO: use args from the window.location.searchParams
// we can still support this as a fallback for developer mode though. it's useful

const instanceId = NIL_UUID;
const connectUrl = new URL(`ws://127.0.0.1:8000/api/v1/connect/${instanceId}`);
connectUrl.searchParams.set("player_id", generateCUID("ply"));
connectUrl.searchParams.set("nickname", "Player" + Math.floor(Math.random() * 999) + 1);
// connectUrl.searchParams.set("play_session", "1");

const container = document.createElement("div");
container.style.width = "100%";
container.style.height = "100%";

const playContainer = document.createElement("div");
playContainer.style.width = "100%";
playContainer.style.height = "100%";

const setup = async (conn: ClientConnection, games: GlobalGames, editMode: boolean) => {
  const game = games.edit;

  if (editMode) {
    renderEditorUI(games, container, playContainer);
  } else {
    document.querySelector("#root")!.append(container);
  }

  await fonts;

  await setupGame(game, conn, editMode);

  let now = performance.now();
  const onFrame = (time: number) => {
    const delta = time - now;
    now = time;
    game.tickClient(delta);
    games.play?.tickClient(delta);

    requestAnimationFrame(onFrame);
  };

  requestAnimationFrame(onFrame);
};

const socket = new WebSocket(connectUrl.toString());
socket.binaryType = "arraybuffer";
Object.defineProperty(window, "socket", { value: socket });
const [game, conn, handshake] = await connectToGame(
  instanceId,
  container,
  socket,
  DEFAULT_CODEC,
);
const games: GlobalGames = { edit: game };
_setGlobalGames(games);
Object.defineProperties(window, {
  game: { value: game },
  conn: { value: conn },
  games: { value: games },
});
await setup(conn, games, handshake.edit_mode);
