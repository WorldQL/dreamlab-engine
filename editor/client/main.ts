import "../../build-system/live-reload.js";

import { NIL_UUID } from "jsr:@std/uuid@1/constants";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { setupGame } from "./game-setup.ts";
import { connectToGame } from "./game-connection.ts";
import { JSON_CODEC } from "@dreamlab/proto/codecs/simple-json.ts";
import { renderInspector } from "./inspector/inspector.ts";

import "../common/facades/mod.ts";
import { setupMultiplayerCursors } from "./multiplayer-cursors.ts";

const instanceId = NIL_UUID;
const connectUrl = new URL(`ws://127.0.0.1:8000/api/v1/connect/${instanceId}`);
connectUrl.searchParams.set("player_id", generateCUID("ply"));
connectUrl.searchParams.set("nickname", "Player" + Math.floor(Math.random() * 999) + 1);

const editUIRoot = document.querySelector("main")!;
const gameViewport = document.querySelector("#viewport")!;

const container = document.createElement("div");
container.style.height = "100%";
container.style.width = "100%";
gameViewport.append(container);

const socket = new WebSocket(connectUrl);

const [game, conn, handshake] = await connectToGame(instanceId, container, socket, JSON_CODEC);
setupMultiplayerCursors(game);
await setupGame(game, conn, handshake.edit_mode);

Object.defineProperties(globalThis, { game: { value: game }, conn: { value: conn } });

renderInspector(game, editUIRoot);

let now = performance.now();
const onFrame = (time: number) => {
  const delta = time - now;
  now = time;
  game.tickClient(delta);

  requestAnimationFrame(onFrame);
};

requestAnimationFrame(onFrame);
