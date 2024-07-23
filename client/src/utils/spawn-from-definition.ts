// TODO: Move this to the engine

import { ClientGame, Entity } from "@dreamlab/engine";
import { Scene, SceneSchema } from "../scene-graph/schema.ts";
import { Behavior } from "@dreamlab/engine";

// URLs for scripts are relative project paths.
// URLs inside entities should use res:// or cloud://. Entities should be written in a way
// that resolves res:// or cloud:// URLs.

export const SAMPLE_SCENE = {
  registration: [],
  local: [],
  world: [
    {
      _ref: "ent_dloj0asy030wvb9iq2evsul4",
      name: "DefaultSquare",
      typeName: "@core/Rigidbody2D",
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
      values: { type: "fixed" },
    },
    {
      _ref: "ent_xsbuvdpm3hs8hcc5q1thmnmr",
      name: "DefaultSquare.1",
      typeName: "@core/Rigidbody2D",
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
      values: { type: "fixed" },
    },
    {
      _ref: "ent_ezcc2xr7v4d9oc79s5yabfzs",
      name: "SpriteContainer",
      typeName: "@core/Empty",
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 2, y: 1 }, z: 0 },
      values: {},
      children: [
        {
          _ref: "ent_jxojyh0iy2ap3vkh92jpod7x",
          name: "Sprite",
          typeName: "@core/Sprite2D",
          transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, z: 0 },
          values: { width: 1, height: 1, alpha: 1, texture: "" },
          behaviors: [
            {
              _ref: "bhv_x11bi98dmgxcmjw1m6exk9by",
              values: { speed: 1 },
              typeName: "jackson.test/WASDMovementBehavior",
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
  spawnEntitiesFromDefinitions(sceneData.world, game.world);

  console.log(scene);
};

// TODO: Add types after making schema match implementation.
function spawnEntitiesFromDefinitions(data: any, parent: Entity) {
  data.forEach((entity: any) => {
    // Print the current item's name and its parent's name
    console.log(`Name: ${entity.name}`);
    const entityConstructor = Entity.getEntityType(entity.typeName);
    const behaviors = [];
    if (entity.behaviors) {
      for (const b of entity.behaviors) {
        const behaviorType = Behavior.getBehaviorType(b.typeName);
        behaviors.push({
          type: behaviorType,
          values: b.values,
        });
      }
    }
    const newEntity = parent.spawn({
      type: entityConstructor,
      name: entity.name,
      behaviors
    });

    // If the entity definition has children, recurse
    if (entity.children && entity.children.length > 0) {
      spawnEntitiesFromDefinitions(entity.children, newEntity);
    }
  });
}
