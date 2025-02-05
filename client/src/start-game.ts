import type { ClientGame } from "@dreamlab/engine";
import { preloadFonts } from "./fonts.ts";
import { connectToGame, pickCodec } from "./game-connection.ts";
import { setupGame } from "./game-setup.ts";

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

  const url = new URL(connectUrl);
  const codec = pickCodec(url, undefined);

  const socket = new WebSocket(url);
  socket.binaryType = "arraybuffer";

  const [game, conn, handshake] = await connectToGame(instanceId, container, socket, codec);
  gameCallback(game);

  await fonts;
  await setupGame(game, conn, handshake.edit_mode);

  new ResizeObserver(_ => {
    game.renderer.resize();
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
