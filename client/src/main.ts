import {
  Camera,
  ClientGame,
  Empty,
  GameStatus,
  Gizmo,
  Rigidbody2D,
  Sprite2D,
} from "@dreamlab/engine";
import { renderEditorUI } from "./editor-ui-main.tsx";
import { createEditorGame } from "./global-game.ts";

import { SceneView } from "./scene-graph/scene-view.ts";
import { Scene, SceneDescSceneSchema } from "./scene-graph/schema.ts";

try {
  // @ts-expect-error injected global
  if (LIVE_RELOAD) {
    new EventSource("/esbuild").addEventListener("change", () => location.reload());
  }
} catch {
  // Ignore
}

const main = async () => {
  const container = document.createElement("div");
  container.style.width = "100%;"; // TODO: can pixi just handle the resizing all on its own for us?
  container.style.height = "100%";

  const game: ClientGame = createEditorGame(container);
  Object.defineProperty(window, "game", { value: game }); // for debugging
  renderEditorUI(container);
  await game.initialize();

  // resize app to fit parent
  const ro = new ResizeObserver(() => game.renderer.app.resize());
  ro.observe(container);

  game.local.spawn({
    type: Camera,
    name: "Camera",
    values: { smooth: 1 },
  });

  // editor
  game.physics.enabled = false;

  game.local.spawn({
    type: Gizmo,
    name: "Gizmo",
  });

  // set to false locally if you are charlotte
  if (true) {
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
  } else {
    const exampleScene: Scene = SceneDescSceneSchema.parse({
      registration: [],
      local: [],
      world: [
        {
          type: "@core/Sprite2D",
          ref: "myrefasdghjasg",
          name: "MySprite",
        },
      ],
      prefabs: [],
      remote: [],
    });

    const sceneView = new SceneView(game, exampleScene);
    Object.defineProperty(window, "sceneView", { value: sceneView });
    await sceneView.initialize();
  }

  game.setStatus(GameStatus.Running);
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
