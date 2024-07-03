import { Camera, Game, GameStatus, Sprite2D } from "@dreamlab/engine";
import HoldPosBehavior from "./hold-position-behavior.ts";
import { EditorEntity } from "./editor-entity-test.ts";

const SYNCED_VALUE_TEST = false;

export async function setupLevel(game: Game) {
  await game.initialize();

  game.local?.spawn({
    type: Camera,
    name: "Camera",
  });

  if (SYNCED_VALUE_TEST) {
    game.world.spawn({
      type: Sprite2D,
      name: "MyEntity",
      behaviors: [
        {
          type: HoldPosBehavior,
          _ref: "bhv_custom_1",
        },
      ],
      _ref: "ent_custom_1",
    });
  }

  if (false) {
    game.world.spawn({
      type: Sprite2D,
      name: "Sprite.001",
      transform: {
        position: {
          x: -1,
          y: 0,
        },
      },
      _ref: "ent_custom_2",
    });

    game.world.spawn({
      type: Sprite2D,
      name: "Sprite.002",
      transform: {
        position: {
          x: 1,
          y: 0,
        },
      },
      _ref: "ent_custom_3",
    });
  }

  game.world.spawn({
    type: EditorEntity,
    name: "MyEditorEntity",
    _ref: "ent_custom_4",
  });

  game.setStatus(GameStatus.Running);
}
