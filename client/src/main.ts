import { ClientGame } from "@dreamlab/engine";
import { renderReact } from "./react-test.tsx";

renderReact();

const initializeRender = async () => {
  const container = document.querySelector("#dreamlab-render") as HTMLDivElement;

  // Try again if the container doesn't exist yet. This line never runs on my machine.
  if (!container) setTimeout(initializeRender)

  container.style.width = "1280px";
  container.style.height = "720px";

  const game = new ClientGame({
    connectionId: "00000000-0000-0000-0000-000000000000",
    container,
    instanceId: "[editor]",
    worldId: "[editor]",
  });
  await game.initialize();

  // editor
  game.physics.enabled = false;

  const TICKS_PER_SECOND = 60;
  const tickDelta = 1000 / TICKS_PER_SECOND;
  let tickAccumulator = 0;
  let now = performance.now();
  const onFrame = (time: number) => {
    const delta = time - now;
    now = time;
    tickAccumulator += delta;

    while (tickAccumulator >= tickDelta) {
      tickAccumulator -= tickDelta;
      game.tick();
    }

    game.drawFrame(delta);

    requestAnimationFrame(onFrame);
  };
  requestAnimationFrame(onFrame);

  Object.defineProperty(window, "game", { value: game });
};

setTimeout(initializeRender)