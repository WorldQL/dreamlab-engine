import "./css/main.css";

import "@dreamlab/client/_env.ts";
import "../../build-system/live-reload.js";

import { preloadFonts } from "./fonts.ts";

const fonts = preloadFonts({
  families: ["Inter", "Iosevka"],
  styles: ["normal"],
  weights: ["400", "500"],
});

import "./draggable-layout.ts";

import "../common/mod.ts";

import { connectToGame } from "@dreamlab/client/game-connection.ts";
import { setupGame } from "@dreamlab/client/game-setup.ts";
import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import { Camera, ClientGame, Entity, GameStatusChange } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { urlToWebSocket } from "@dreamlab/util/url.ts";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { stats } from "./_stats.ts";
import { CameraPanBehavior } from "./camera-pan.ts";
import { AppMenu } from "./ui/app-menu.ts";
import { InspectorUI } from "./ui/inspector.ts";
import { LogViewer } from "./ui/log-viewer.ts";
import { UndoRedoManager } from "./undo-redo.ts";

// TODO: loading screen ?

const connectUrl = urlToWebSocket(connectionDetails.serverUrl);
connectUrl.pathname = `/api/v1/connect/${connectionDetails.instanceId}`;
connectUrl.searchParams.set("player_id", generateCUID("ply"));
connectUrl.searchParams.set("nickname", "Player" + Math.floor(Math.random() * 999) + 1);

const loadingElem = document.querySelector("#loading")! as HTMLElement;

const uiRoot = document.querySelector("main")! as HTMLElement;
const container = document.createElement("div");
uiRoot.querySelector("#viewport")!.append(container);
uiRoot.style.display = "none";

const socket = new WebSocket(connectUrl);
socket.binaryType = "arraybuffer";

loadingElem.textContent =
  "Connecting... (If you see this message for more than 5 seconds, try to reload the page.)";

socket.addEventListener("error", () => {
  loadingElem.textContent = `Failed to connect. Try reloading the page.`;
});

const [game, conn, handshake] = await connectToGame(
  connectionDetails.instanceId,
  container,
  socket,
  DEFAULT_CODEC,
  true,
);

game.on(GameStatusChange, () => {
  if (game.statusDescription) {
    loadingElem.textContent = `${game.status}: ${game.statusDescription}`;
  } else {
    loadingElem.textContent = `Loading... (${game.status})`;
  }
});

const games: { edit: ClientGame; play: ClientGame | undefined } = {
  edit: game,
  play: undefined,
};

new ResizeObserver(_ => {
  games.edit.renderer?.app?.resize?.();
  games.play?.renderer?.app?.resize?.();
}).observe(uiRoot.querySelector("#viewport")!);

Object.defineProperties(globalThis, {
  game: { value: game },
  conn: { value: conn },
  games: { value: games },
});

// setupMultiplayerCursors(game);
await fonts;
await setupGame(game, conn, handshake.edit_mode);

const registry = Entity[internal.entityTypeRegistry];
for (const [type, namespace] of registry) {
  if (namespace === "@editor") continue;
  Object.defineProperty(globalThis, type.name, { value: type });
}

if (handshake.edit_mode) {
  game[internal.behaviorLoader].registerInternalBehavior(CameraPanBehavior, "@editor");
  game.local._.Camera.cast(Camera).addBehavior({ type: CameraPanBehavior });
}

loadingElem.style.display = "none";
uiRoot.style.display = "";

const inspector = new InspectorUI(game, conn, handshake.edit_mode, container);
inspector.show(uiRoot);

const appMenu = new AppMenu(uiRoot, games);
appMenu.setup(inspector);

const logViewer = new LogViewer(uiRoot, games);
logViewer.setup(inspector);

const _ = new UndoRedoManager(game);

let now = performance.now();
const onFrame = (time: number) => {
  stats.begin();
  const delta = time - now;
  now = time;
  games.edit.tickClient(delta);
  if (games.play) {
    try {
      games.play.tickClient(delta);
    } catch (err) {
      console.error(err);
    }
  }
  stats.end();

  requestAnimationFrame(onFrame);
};

requestAnimationFrame(onFrame);
