import { CameraAspectChanged, RichText, type ClientGame } from "@dreamlab/engine";
import { setAspectRatio, updateAspectRatio } from "./aspect-ratio.ts";
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
  errorCallback: () => void = () => {},
) {
  const uiRoot = document.querySelector("main")! as HTMLElement;
  const container = document.createElement("div");
  uiRoot.querySelector("#game")!.append(container);

  const url = new URL(connectUrl);
  const codec = pickCodec(url, undefined);

  const socket = new WebSocket(url);
  socket.binaryType = "arraybuffer";
  socket.addEventListener("error", () => {
    errorCallback();
  });

  const [game, conn, handshake] = await connectToGame(instanceId, container, socket, codec);
  gameCallback(game);

  game.on(CameraAspectChanged, ({ camera }) => {
    setAspectRatio(camera.lockAspectRatio, camera.aspectRatio);
  });

  await setupGame(game, conn, handshake.edit_mode);
  fonts.then(() => {
    game.entities.lookupByType(RichText).forEach(text => text.rerender());
  });

  new ResizeObserver(_ => {
    updateAspectRatio();
    game.renderer.resize(true);
  }).observe(uiRoot.querySelector("#viewport")!);

  const detectPixelRatioChange = () => {
    globalThis.matchMedia(`(resolution: ${globalThis.devicePixelRatio}dppx)`).addEventListener(
      "change",
      () => {
        updateAspectRatio();
        game.renderer.resize(true);
        detectPixelRatioChange();
      },
      { once: true },
    );
  };
  detectPixelRatioChange();

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
