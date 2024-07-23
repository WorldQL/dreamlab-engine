import {
  Behavior,
  Camera,
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
import { Scene, SceneSchema } from "./scene-graph/schema.ts";
import { z } from "@dreamlab/vendor/zod.ts";
import { Entity } from "@dreamlab/engine"
import { SAMPLE_SCENE, loadSceneFromDefinition } from "./utils/spawn-from-definition.ts";

try {
  // @ts-expect-error injected global
  if (LIVE_RELOAD) {
    new EventSource("/esbuild").addEventListener("change", () => location.reload());
  }
} catch {
  // Ignore
}

const main = async () => {
  let instanceId = "";
  let gameParam = "";

  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    instanceId = params.get("instance") || "";
    gameParam = params.get("game") || "";
    // server = params.get("server") || "";
    // editmode = params.get("editmode") === "true";
  }

  const container = document.createElement("div");
  container.style.width = "100%"; // TODO: can pixi just handle the resizing all on its own for us?
  container.style.height = "100%";

  const game = createEditorGame(container, instanceId, gameParam);
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

  Behavior.registerType(WASDMovementBehavior, "jackson.test")

  const giz = game.local.spawn({
    type: Gizmo,
    name: "Gizmo",
  });

  // set to false locally if you are charlotte
  if (true) {
    // const body = game.world.spawn({
    //   type: Rigidbody2D,
    //   name: "DefaultSquare",
    // });

    // const body2 = game.world.spawn({
    //   type: Rigidbody2D,
    //   name: "DefaultSquare",
    // });

    // const spriteParent = game.world.spawn({
    //   type: Empty,
    //   name: "SpriteContainer",
    // });
    // spriteParent.transform.scale.x = 2;

    // const sprite2d = Entity.getEntityType("@core/Sprite2D")

    // const sprite = spriteParent.spawn({
    //   type: sprite2d,
    //   name: "Sprite",
    //   behaviors: [
    //     // spawn the sprite with SpinBehavior
    //     { type: WASDMovementBehavior },
    //   ],
    // });
    
    // THIS IS HOW YOU SAVE A SCENE.
    // TODO tomorrow: Write function to save game to json.
    // const definitions = []
    // for (const [_, value] of game.world.children) {
    //   definitions.push(value.getDefinition())
    // }
    
    // console.log(definitions)

    // console.log(JSON.stringify(definitions))
    // console.log(Entity.getTypeName(Sprite2D))

    // setTimeout(() => {
    //   console.log("adding WASD movement");
    //   sprite.addBehavior({ type: WASDMovementBehavior });
    // }, 5000);

    loadSceneFromDefinition(game, SAMPLE_SCENE)

    // const exampleScene: Scene = SceneDescSceneSchema.parse({
    //   registration: [],
    //   local: [],
    //   world: [
    //     {
    //       type: "@core/Sprite2D",
    //       name: "foo",
    //       ref: "myrefasdghjasg",
    //       transform: {
    //         'position': {'x': 1, 'y': 2}
    //       }
    //     },
    //   ],
    //   prefabs: [],
    //   remote: [],
    // } satisfies z.input<typeof SceneDescSceneSchema>);

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
    const exampleScene: Scene = SceneSchema.parse({
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
