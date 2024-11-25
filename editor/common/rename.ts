import { ServerGame } from "@dreamlab/engine";
import { BehaviorSchema } from "@dreamlab/scene";
import { EditorMetadataEntity } from "./metadata.ts";

// called from the server, which will then broadcast behaviorsJson updates to all clients
export function editorRenameBehavior(game: ServerGame, oldUri: string, newUri: string) {
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
