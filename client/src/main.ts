import { ClientGame } from "@dreamlab/engine";
import { renderEditorUI } from "./editor-ui-main.tsx";

declare global {
  // you have to use var here
  // deno-lint-ignore no-var
  var game: ClientGame | undefined
  // TODO: Store two copies of game, one for running and one for !running
}

const main = async () => {
  const container = document.createElement("div");
  container.style.width = "1280px"; // TODO: can pixi just handle the resizing all on its own for us?
  container.style.height = "720px";

  const game = new ClientGame({
    connectionId: "00000000-0000-0000-0000-000000000000",
    container,
    instanceId: "[editor]",
    worldId: "[editor]",
  });
  Object.defineProperty(window, "game", { value: game });

  renderEditorUI(container);

  await game.initialize();
  // editor
  game.physics.enabled = false;

  // tick loop (TODO: replace with new time system)
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

    game.drawFrame(time, delta);

    requestAnimationFrame(onFrame);
  };
  requestAnimationFrame(onFrame);
};

if (document.readyState === "complete") {
  void main();
} else {
  document.addEventListener("DOMContentLoaded", () => void main());
}
