import { ClientGame } from "@dreamlab/engine";
import { renderEditorUI } from "./editor-ui-main.tsx";

renderEditorUI();

const main = async () => {
  const container = document.querySelector("#dreamlab-render") as HTMLDivElement;

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

    game.drawFrame(time, delta);

    requestAnimationFrame(onFrame);
  };
  requestAnimationFrame(onFrame);

  Object.defineProperty(window, "game", { value: game });
};

if (document.readyState === "complete") {
  void main();
} else {
  document.addEventListener("DOMContentLoaded", () => void main());
}
