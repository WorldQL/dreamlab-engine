import {
  Behavior,
  Camera,
  ClientGame,
  Empty,
  GameStatus,
  Gizmo,
  Rigidbody2D,
  Sprite2D,
  Vector2,
} from "@dreamlab/engine";
import { renderEditorUI } from "./editor-ui-main.tsx";
import { createEditorGame } from "./global-game.ts";

import { SceneView } from "./scene-graph/scene-view.ts";
import { Scene, SceneDescSceneSchema } from "./scene-graph/schema.ts";

class SpinBehavior extends Behavior {
  speed: number = 1.0;

  onInitialize(): void {
    this.value(SpinBehavior, "speed");
  }

  onTick(): void {
    this.entity.transform.rotation += this.speed * (Math.PI / this.game.time.TPS);
    // this is never being logged on the client. it works in the engine web tests, but not in the client/editor
    console.log("ticked spinbehavior!");
  }
}

try {
  // @ts-expect-error injected global
  if (LIVE_RELOAD) {
    new EventSource("/esbuild").addEventListener("change", () => location.reload());
  }
} catch {
  // Ignore
}

const main = async () => {
  let spinner;
  if (typeof window !== "undefined") {
    const url = "/test-behaviors/spin.js";
    const imported = await import(url);
    spinner = imported.default;
  }
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
  class WASDMovementBehavior extends Behavior {
    speed = 1.0;

    #up = this.inputs.create("@wasd/up", "Move Up", "KeyW");
    #down = this.inputs.create("@wasd/down", "Move Down", "KeyS");
    #left = this.inputs.create("@wasd/left", "Move Left", "KeyA");
    #right = this.inputs.create("@wasd/right", "Move Right", "KeyD");

    onInitialize(): void {
      this.value(WASDMovementBehavior, "speed");
    }

    onTick(): void {
      const movement = new Vector2(0, 0);
      if (this.#up.held) movement.y += 1;
      if (this.#down.held) movement.y -= 1;
      if (this.#right.held) movement.x += 1;
      if (this.#left.held) movement.x -= 1;

      this.entity.transform.position = this.entity.transform.position.add(
        movement.normalize().mul((this.time.delta / 100) * this.speed),
      );
    }

    onFrame(): void {}
  }

  const giz = game.local.spawn({
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
      behaviors: [
        // spawn the sprite with SpinBehavior
        { type: spinner },
      ],
    });

    setTimeout(() => {
      console.log('adding WASD movement')
      sprite.addBehavior({ type: WASDMovementBehavior });
    }, 5000)

    // setTimeout(() => {
    //   for (let i = 0; i < 50000; i++) {
    //     const start = performance.now()
    //     const spriteParent = game.world.spawn({
    //       type: Empty,
    //       name: "goopy",
    //     });
    //     const end = performance.now();
    //     console.log(`${i} took ${end-start}`);
    //   }
    // }, 2000);
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
  game.paused = true;
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
