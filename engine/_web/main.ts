import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { Camera, ClientGame, GameStatus, Vector2 } from "../mod.ts";

// #region Setup
// @ts-expect-error global
if (IS_DEV) {
  new EventSource("/esbuild").addEventListener("change", () => location.reload());
}

document.documentElement.style.height = "100%";
document.body.style.height = "100%";
document.body.style.margin = "0";
document.body.style.overflow = "hidden";

const container = document.createElement("div");
document.body.append(container);
container.style.width = "100%";
container.style.height = "100%";

const game = new ClientGame({
  instanceId: "0",
  worldId: "dummy-world",
  // prettier-ignore
  network: {
    connectionId: generateCUID("conn"),
    peers: [],
    sendCustomMessage() {},
    broadcastCustomMessage() {},
    onReceiveCustomMessage() {},
  },
  container,
});

await game.initialize();
const camera = game.local.spawn({
  type: Camera,
  name: "Camera",
});

declare global {
  const game: ClientGame;
  const camera: Camera;
}

Object.assign(window, { game, camera, Vector2 });
// #endregion

const mod = await import("./test-cases/demo-game.ts");
Object.assign(window, { ...mod });

game.setStatus(GameStatus.Running);

// #region Tick loop
let now = performance.now();
const onTick = (time: number) => {
  const delta = time - now;
  now = time;
  game.tickClient(delta);

  requestAnimationFrame(onTick);
};

requestAnimationFrame(onTick);
// #endregion
