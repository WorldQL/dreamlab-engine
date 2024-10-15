import "./css/client.css";

import "../../build-system/live-reload.js";
import "./_env.ts";

import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { urlToHTTP, urlToWebSocket } from "@dreamlab/util/url.ts";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { createConnectForm } from "./connect-form.ts";
import { connectToGame } from "./game-connection.ts";
import { setupGame } from "./game-setup.ts";
import { connectionDetails, setConnectionDetails } from "./util/server-url.ts";

let nickname = "Player" + Math.floor(Math.random() * 999) + 1;

if (connectionDetails.instanceId === "") {
  const searchParams = new URLSearchParams(window.location.search);
  const worldId = searchParams.get("worldId");
  if (worldId === null) {
    alert("Missing a worldId or a connect URL");
    throw new Error();
  }

  const connectForm = await createConnectForm(worldId);
  document.body.prepend(connectForm.form);
  const { serverUrl, instanceId, nickname: nickname_ } = await connectForm.onConnect;
  setConnectionDetails({ instanceId, serverUrl: urlToHTTP(serverUrl).toString() });
  nickname = nickname_;
}

const connectUrl = urlToWebSocket(connectionDetails.serverUrl);
connectUrl.pathname = `/api/v1/connect/${connectionDetails.instanceId}`;
// TODO: connect with an auth token instead, if one is passed via search params
connectUrl.searchParams.set("player_id", generateCUID("ply"));
connectUrl.searchParams.set("nickname", nickname);

const uiRoot = document.querySelector("main")! as HTMLElement;
const container = document.createElement("div");
uiRoot.querySelector("#viewport")!.append(container);

const socket = new WebSocket(connectUrl);
socket.binaryType = "arraybuffer";

const [game, conn, handshake] = await connectToGame(
  connectionDetails.instanceId,
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
