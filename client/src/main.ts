import "@dreamlab/vendor/polyfills.ts";

import "./css/client.css";

import "../../build-system/live-reload.js";
import "./_env.ts";

import { ClientGame } from "@dreamlab/engine";
import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { preloadFonts } from "./fonts.ts";
import { connectToGame } from "./game-connection.ts";
import { setupGame } from "./game-setup.ts";

// only used for non-discord connections:

const fonts = preloadFonts({
  families: ["Inter", "Iosevka", "Eas VHS"],
  styles: ["normal"],
  weights: ["normal", "400", "500"],
});

export async function startGame(
  connectUrl: string | URL,
  instanceId: string,
  gameCallback: (game: ClientGame) => void = () => {},
) {
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
  gameCallback(game);

  await fonts;
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
}

const USE_DISCORD = new URLSearchParams(window.location.search).has("frame_id");

if (USE_DISCORD) {
  void import("./init-discord.ts");
} else {
  void import("./init.ts");
}
