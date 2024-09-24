import "./css/main.css";

import "../../build-system/live-reload.js";
import "./_env.ts";

import { connectToGame } from "@dreamlab/editor/game-connection.ts";
import { setupGame } from "@dreamlab/editor/game-setup.ts";
import { INSTANCE_ID, SERVER_URL } from "@dreamlab/editor/util/server-url.ts";
import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";

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

await setupGame(game, conn, handshake.edit_mode);

new ResizeObserver(_ => {
  game.renderer.app.resize();
}).observe(uiRoot.querySelector("#viewport")!);

Object.defineProperties(globalThis, {
  game: { value: game },
  conn: { value: conn },
});

let now = performance.now();
const onFrame = (time: number) => {
  const delta = time - now;
  now = time;
  game.tickClient(delta);

  requestAnimationFrame(onFrame);
};

requestAnimationFrame(onFrame);
