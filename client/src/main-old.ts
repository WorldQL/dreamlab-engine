import { Behavior, Camera, GameStatus, Gizmo, Vector2 } from "@dreamlab/engine";
import { renderEditorUI } from "./editor/editor-ui-main.tsx";
import { createGame } from "./editor/global-game.ts";

import * as internal from "../../engine/internal.ts";
import { setPlayModeGame } from "./editor/global-game.ts";

import { Scene, loadSceneDefinition, serializeSceneDefinition } from "@dreamlab/scene";

export const SAMPLE_SCENE: Scene = {
  world: [
    {
      ref: "ent_l1wx3qcq9xxy5bg6u8n036wy",
      name: "DefaultSquare",
      type: "@core/Rigidbody2D",
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
      values: { type: "fixed" },
    },
    {
      ref: "ent_kkm6r17dsj197dla0iu9fbjp",
      name: "DefaultSquare.1",
      type: "@core/Rigidbody2D",
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
      values: { type: "fixed" },
    },
    {
      ref: "ent_qitlau9pgtq5y8wmxuym0paf",
      name: "SpriteContainer",
      type: "@core/Empty",
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 2, y: 1 }, z: 0 },
      values: {},
      children: [
        {
          ref: "ent_ame972vw6ejknflhvv35n2xp",
          name: "Sprite",
          type: "@core/Sprite2D",
          transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
          values: { width: 1, height: 1, alpha: 1, texture: "" },
          behaviors: [
            {
              ref: "bhv_dgneu7qncn6wxed6rgvoww5u",
              values: { speed: 1 },
              script: "builtin:jackson.test/WASDMovementBehavior",
            },
          ],
        },
      ],
    },
  ],
};

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

  const editModeGameContainer = document.createElement("div");
  editModeGameContainer.style.width = "100%"; // TODO: can pixi just handle the resizing all on its own for us?
  editModeGameContainer.style.height = "100%";

  const playModeGameContainer = document.createElement("div");
  playModeGameContainer.style.width = "100%"; // TODO: can pixi just handle the resizing all on its own for us?
  playModeGameContainer.style.height = "100%";

  const game = createGame(
    editModeGameContainer,
    "connectionIdPlaceholder",
    instanceId,
    gameParam,
  );
  const playModeGame = createGame(
    playModeGameContainer,
    "connectionIdPlaceholder",
    instanceId,
    gameParam,
  );

  setPlayModeGame(playModeGame);
  // Object.defineProperty(window, "game", { value: game }); // for debugging

  renderEditorUI(game, editModeGameContainer, playModeGameContainer);
  await game.initialize();
  await playModeGame.initialize();

  // resize app to fit parent
  const ro = new ResizeObserver(() => game.renderer.app.resize());
  ro.observe(editModeGameContainer);
  const ro2 = new ResizeObserver(() => playModeGame.renderer.app.resize());
  ro2.observe(playModeGameContainer);

  game.local.spawn({
    type: Camera,
    name: "Camera",
    values: { smooth: 1 },
  });

  playModeGame.local.spawn({
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

  game[internal.behaviorLoader].registerInternalBehavior(WASDMovementBehavior, "jackson.test");
  playModeGame[internal.behaviorLoader].registerInternalBehavior(
    WASDMovementBehavior,
    "jackson.test",
  );

  game.local.spawn({
    type: Gizmo,
    name: "Gizmo",
  });

  await loadSceneDefinition(game, SAMPLE_SCENE);
  console.log(JSON.stringify(serializeSceneDefinition(game)));

  game.setStatus(GameStatus.Running);
  playModeGame.setStatus(GameStatus.Running);
  game.paused = true;
  playModeGame.paused = true;

  let now = performance.now();
  const onFrame = (time: number) => {
    const delta = time - now;
    now = time;
    // all this will be replaced by properly loading / destroying game when networking is in
    game.tickClient(delta);
    playModeGame.tickClient(delta);

    requestAnimationFrame(onFrame);
  };
  requestAnimationFrame(onFrame);
};

if (document.readyState === "complete") {
  void main();
} else {
  document.addEventListener("DOMContentLoaded", () => void main());
}
