import { BasicEntity, ClientGame, Rigidbody2D, Sprite } from "@dreamlab/engine";
import { renderEditorUI } from "./editor-ui-main.tsx";
import { createEditorGame } from "./game.ts";

declare global {
  // you have to use var here
  // deno-lint-ignore no-var
  var game: ClientGame | undefined;
  // TODO: Store two copies of game, one for running and one for !running
}

const main = async () => {
  const container = document.createElement("div");
  container.style.width = "1280px"; // TODO: can pixi just handle the resizing all on its own for us?
  container.style.height = "720px";

  const game: ClientGame = createEditorGame(container);
  Object.defineProperty(window, "game", { value: game }); // for debugging
  renderEditorUI(container);
  await game.initialize();

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
    type: BasicEntity,
    name: "SpriteContainer",
  });
  spriteParent.transform.scale.x = 2;
  const sprite = spriteParent.spawn({
    type: Sprite,
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
