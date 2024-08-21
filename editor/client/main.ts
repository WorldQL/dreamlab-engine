import "./css/main.css";

import "../../build-system/live-reload.js";
import "./_env.ts";

import { preloadFonts } from "./fonts.ts";

const fonts = preloadFonts({
  families: ["Inter", "Iosevka"],
  styles: ["normal"],
  weights: ["400", "500"],
});

import "../common/mod.ts";

import { Camera, ClientGame } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { NIL_UUID } from "jsr:@std/uuid@1/constants";
import { CameraPanBehavior } from "./camera-pan.ts";
import { connectToGame } from "./game-connection.ts";
import { setupGame } from "./game-setup.ts";
import { AppMenu } from "./ui/app-menu.ts";
import { InspectorUI } from "./ui/inspector.ts";

// TODO: loading screen ?

const instanceId = NIL_UUID;
const connectUrl = new URL(import.meta.env.SERVER_URL);
connectUrl.protocol = connectUrl.protocol === "https:" ? "wss:" : "ws:";
connectUrl.pathname = `/api/v1/connect/${instanceId}`;
connectUrl.searchParams.set("player_id", generateCUID("ply"));
connectUrl.searchParams.set("nickname", "Player" + Math.floor(Math.random() * 999) + 1);

const uiRoot = document.querySelector("main")! as HTMLElement;
const container = document.createElement("div");
uiRoot.querySelector("#viewport")!.append(container);

const socket = new WebSocket(connectUrl);
socket.binaryType = "arraybuffer";

const [game, conn, handshake] = await connectToGame(
  instanceId,
  container,
  socket,
  DEFAULT_CODEC,
);

const games: { edit: ClientGame; play: ClientGame | undefined } = {
  edit: game,
  play: undefined,
};

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

const inspector = new InspectorUI(game, conn, handshake.edit_mode, container);
inspector.show(uiRoot);

const appMenu = new AppMenu(uiRoot, games);
appMenu.setup(inspector);

let now = performance.now();
const onFrame = (time: number) => {
  const delta = time - now;
  now = time;
  games.edit.tickClient(delta);
  games.play?.tickClient(delta);

  requestAnimationFrame(onFrame);
};

requestAnimationFrame(onFrame);
