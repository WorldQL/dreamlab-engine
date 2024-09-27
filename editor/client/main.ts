import "./css/main.css";

import "../../build-system/live-reload.js";
import "@dreamlab/client/_env.ts";

import { preloadFonts } from "./fonts.ts";

const fonts = preloadFonts({
  families: ["Inter", "Iosevka"],
  styles: ["normal"],
  weights: ["400", "500"],
});

import "./draggable-layout.ts";

import "../common/mod.ts";

import { Camera, ClientGame } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { connectToGame } from "../../client/src/game-connection.ts";
import { setupGame } from "../../client/src/game-setup.ts";
import { INSTANCE_ID, SERVER_URL } from "../../client/src/util/server-url.ts";
import { stats } from "./_stats.ts";
import { CameraPanBehavior } from "./camera-pan.ts";
import { AppMenu } from "./ui/app-menu.ts";
import { InspectorUI } from "./ui/inspector.ts";
import { LogViewer } from "./ui/log-viewer.ts";

// TODO: loading screen ?

const connectUrl = new URL(SERVER_URL);
connectUrl.protocol = connectUrl.protocol === "https:" ? "wss:" : "ws:";
connectUrl.pathname = `/api/v1/connect/${INSTANCE_ID}`;
connectUrl.searchParams.set("player_id", generateCUID("ply"));
connectUrl.searchParams.set("nickname", "Player" + Math.floor(Math.random() * 999) + 1);

const uiRoot = document.querySelector("main")! as HTMLElement;
const container = document.createElement("div");
uiRoot.querySelector("#viewport")!.append(container);

const socket = new WebSocket(connectUrl);
socket.binaryType = "arraybuffer";

const [game, conn, handshake] = await connectToGame(
  INSTANCE_ID,
  container,
  socket,
  DEFAULT_CODEC,
);

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

if (handshake.edit_mode) {
  game[internal.behaviorLoader].registerInternalBehavior(CameraPanBehavior, "@editor");
  game.local._.Camera.cast(Camera).addBehavior({ type: CameraPanBehavior });
}

(document.querySelector("#loading")! as HTMLElement).style.display = "none";

const inspector = new InspectorUI(game, conn, handshake.edit_mode, container);
inspector.show(uiRoot);

const appMenu = new AppMenu(uiRoot, games);
appMenu.setup(inspector);

const logViewer = new LogViewer(uiRoot, games);
logViewer.setup(inspector);

let now = performance.now();
const onFrame = (time: number) => {
  stats.begin();
  const delta = time - now;
  now = time;
  games.edit.tickClient(delta);
  games.play?.tickClient(delta);
  stats.end();

  requestAnimationFrame(onFrame);
};

requestAnimationFrame(onFrame);
