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

const mod = await import("./test-cases/spaceship-demo-game.ts");
Object.assign(window, { ...mod });

game.setStatus(GameStatus.Running);

let MAX_FPS = 300;// Minimum time between frames in milliseconds

// #region Tick loop
let now = performance.now();
let then = now;
let delta = 0;

const onTick = (time: number) => {
  now = time;
  delta = now - then;
  const FRAME_TIME = 1000 / MAX_FPS; 

  if (delta >= FRAME_TIME) {
    then = now - (delta % FRAME_TIME);
    game.tickClient(delta);
  } else {
    console.log('skipped')
  }

  requestAnimationFrame(onTick);
};

requestAnimationFrame(onTick);

const FPS_TEST_MODE = false;

if (FPS_TEST_MODE) {
  setInterval(() => {
    MAX_FPS = Math.floor(Math.random() * (144 - 20 + 1)) + 20;
  }, 2000)
}
// #endregion
