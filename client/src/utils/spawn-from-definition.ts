// TODO: Move this to the engine

import { ClientGame } from "@dreamlab/engine";
import { z } from "@dreamlab/vendor/zod.ts";
import { Scene, SceneSchema } from "../scene-graph/schema.ts";

// URLs for scripts are relative project paths.
// URLs inside entities should use res:// or cloud://. Entities should be written in a way
// that resolves res:// or cloud:// URLs.

export const spawnFromDefinition = (game: ClientGame, sceneData: any) => {
    const sceneParsed = SceneSchema.safeParse(sceneData);
    if (!sceneParsed.success) {
        throw new Error("Failed to parse level data.")
    }

    const scene: Scene = sceneParsed.data;

    console.log(scene)


}