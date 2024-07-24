// TODO: Move this to the engine

import { BehaviorLoader, ClientGame, Entity } from "@dreamlab/engine";
import { Scene, SceneSchema } from "../scene-graph/schema.ts";
import { Behavior } from "@dreamlab/engine";
import * as internal from "../../../engine/internal.ts";

// URLs for scripts are relative project paths.
// URLs inside entities should use res:// or cloud://. Entities should be written in a way
// that resolves res:// or cloud:// URLs.

export const SAMPLE_SCENE = {
  registration: [],
  local: [],
  world: [
    {
      _ref: "ent_l1wx3qcq9xxy5bg6u8n036wy",
      name: "DefaultSquare",
      typeName: "@core/Rigidbody2D",
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
      values: { type: "fixed" },
    },
    {
      _ref: "ent_kkm6r17dsj197dla0iu9fbjp",
      name: "DefaultSquare.1",
      typeName: "@core/Rigidbody2D",
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
      values: { type: "fixed" },
    },
    {
      _ref: "ent_qitlau9pgtq5y8wmxuym0paf",
      name: "SpriteContainer",
      typeName: "@core/Empty",
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 2, y: 1 }, z: 0 },
      values: {},
      children: [
        {
          _ref: "ent_ame972vw6ejknflhvv35n2xp",
          name: "Sprite",
          typeName: "@core/Sprite2D",
          transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
          values: { width: 1, height: 1, alpha: 1, texture: "" },
          behaviors: [
            {
              _ref: "bhv_dgneu7qncn6wxed6rgvoww5u",
              values: { speed: 1 },
              uri: "builtin:jackson.test/WASDMovementBehavior",
            },
          ],
        },
      ],
    },
  ],
  prefabs: [],
  remote: [],
};

export const loadSceneFromDefinition = (game: ClientGame, sceneData: any) => {
  // TODO: Update the schema to match the format.
  //   const sceneParsed = SceneSchema.safeParse(sceneData);
  //   if (!sceneParsed.success) {
  //     throw new Error("Failed to parse level data.");
  //   }

  // const scene: Scene = sceneParsed.data;

  const scene = sceneData;
  spawnEntitiesFromDefinitions(sceneData.world, game.world, game);

  console.log(scene);
};

// TODO: Add types after making schema match implementation.
function spawnEntitiesFromDefinitions(data: any, parent: Entity, game: ClientGame) {
  data.forEach(async (entity: any) => {
    // Print the current item's name and its parent's name
    console.log(`Name: ${entity.name}`);
    const entityConstructor = Entity.getEntityType(entity.typeName);
    const behaviors = [];
    if (entity.behaviors) {
      for (const b of entity.behaviors) {
        const behaviorType = await game[internal.behaviorLoader].loadScript(b.uri);
        behaviors.push({
          type: behaviorType,
          values: b.values,
        });
      }
    }
    const newEntity = parent.spawn({
      type: entityConstructor,
      name: entity.name,
      behaviors,
      _ref: entity._ref,
    });

    // If the entity definition has children, recurse
    if (entity.children && entity.children.length > 0) {
      spawnEntitiesFromDefinitions(entity.children, newEntity, game);
    }
  });
}
