import { ClientGame, Entity, ValueChanged } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { EditorMetadataEntity } from "../../../common/mod.ts";
import { BehaviorEditor } from "./behavior-editor.ts";
import { SceneDescBehavior, BehaviorSchema as SceneDescBehaviorSchema } from "@dreamlab/scene";

export class BehaviorList {
  container = elem("div");

  editors = new Map<string, BehaviorEditor>();

  behaviors: SceneDescBehavior[] = [];

  constructor(
    public game: ClientGame,
    public entity: Entity,
    public useEditorMetadata: boolean,
  ) {
    if (useEditorMetadata) {
      const editorMetadata = entity.children
        .get("__EditorMetadata")
        ?.cast(EditorMetadataEntity);
      if (!editorMetadata) return;

      this.behaviors = SceneDescBehaviorSchema.array().parse(
        JSON.parse(editorMetadata.behaviorsJson),
      );

      for (const behavior of this.behaviors) {
        const editor = new BehaviorEditor(game, behavior, this);
        this.editors.set(behavior.ref, editor);
      }

      game.values.on(ValueChanged, event => {
        if (event.value !== editorMetadata.values.get("behaviorsJson")) return;
        const newBehaviors = SceneDescBehaviorSchema.array().parse(
          JSON.parse(event.newValue as string),
        );

        for (const newBehavior of newBehaviors) {
          const existingEditor = this.editors.get(newBehavior.ref);
          if (existingEditor) {
            existingEditor.resolveUpdate(newBehavior);
          } else {
            const editor = new BehaviorEditor(game, newBehavior, this);
            this.editors.set(newBehavior.ref, editor);
            this.behaviors.push(newBehavior);
          }
        }

        for (const oldBehavior of this.behaviors) {
          // O(n*m) but n and m are small :)
          if (newBehaviors.find(it => it.ref === oldBehavior.ref) !== undefined) continue;

          const editor = this.editors.get(oldBehavior.ref);
          if (!editor) continue;
          this.editors.delete(oldBehavior.ref);
          editor.details.remove();
        }
      });
    }

    // TODO: play mode
  }

  sync() {
    if (this.useEditorMetadata) {
      const editorMetadata = this.entity.children
        .get("__EditorMetadata")
        ?.cast(EditorMetadataEntity);
      if (!editorMetadata) return;
      editorMetadata.behaviorsJson = JSON.stringify(this.behaviors);
    }

    // TODO: play mode
  }
}
