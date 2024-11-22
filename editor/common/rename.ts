import { ServerGame } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { BehaviorSchema } from "@dreamlab/scene";
import { BehaviorTypeInfoService } from "../client/util/behavior-type-info.ts";
import { EditorMetadataEntity } from "./metadata.ts";

// called from the server, which will then broadcast behaviorsJson updates to all clients
export async function renameBehavior(
  game: ServerGame,
  typeInfoService: BehaviorTypeInfoService | undefined, // supply if edit mode, omit if play
  oldUri: string,
  newUri: string,
) {
  try {
    if (typeInfoService) {
      typeInfoService.rename(oldUri, newUri);
    } else {
      const sourceBehavior = await game[internal.behaviorLoader].loadScript(oldUri);
      game[internal.behaviorLoader].renameBehavior(sourceBehavior, newUri);
    }
  } catch (err) {
    console.warn(err);
  }

  for (const metadata of game.entities.lookupByType(EditorMetadataEntity)) {
    try {
      const behaviorsList = JSON.parse(metadata.behaviorsJson);
      const behaviors = BehaviorSchema.array().parse(behaviorsList);

      for (const behaviorObj of behaviors) {
        // TODO: handle .ts / .js interchangeability. for now just call renameBehavior twice
        if (behaviorObj.script === oldUri) {
          behaviorObj.script = newUri;
        }
      }

      metadata.behaviorsJson = JSON.stringify(behaviors);
    } catch (err) {
      console.warn(err);
      continue;
    }
  }
}
