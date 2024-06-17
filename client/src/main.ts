import { Empty, ClientGame, Rigidbody2D, Sprite2D, Camera } from "@dreamlab/engine";
import { renderEditorUI } from "./editor-ui-main.tsx";
import { createEditorGame } from "./global-game.ts";

const main = async () => {
  const container = document.createElement("div");
  container.style.width = "100%;"; // TODO: can pixi just handle the resizing all on its own for us?
  container.style.height = "100%";

  const game: ClientGame = createEditorGame(container);
  Object.defineProperty(window, "game", { value: game }); // for debugging
  renderEditorUI(container);
  await game.initialize();

  game.local.spawn({ type: Camera, name: "Camera" });

  // editor
  game.physics.enabled = false;

  const body = game.world.spawn({
    type: Rigidbody2D,
    name: "DefaultSquare",
  });

  const body2 = game.world.spawn({
    type: Rigidbody2D,
    name: "DefaultSquare",
  });

  const spriteParent = game.world.spawn({
    type: Empty,
    name: "SpriteContainer",
  });
  spriteParent.transform.scale.x = 2;
  const sprite = spriteParent.spawn({
    type: Sprite2D,
    name: "Sprite",
  });
  console.log(sprite.globalTransform.scale.x);

  let now = performance.now();
  const onFrame = (time: number) => {
    const delta = time - now;
    now = time;
    game.tickClient(delta);

    requestAnimationFrame(onFrame);
  };
  requestAnimationFrame(onFrame);
};

if (document.readyState === "complete") {
  void main();
} else {
  document.addEventListener("DOMContentLoaded", () => void main());
}
