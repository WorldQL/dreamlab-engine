import { BehaviorConstructor, ClientGame, Entity, ValueChanged } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { EditorMetadataEntity } from "../../../common/mod.ts";
import { BehaviorEditor } from "./behavior-editor.ts";
import { SceneDescBehavior, BehaviorSchema as SceneDescBehaviorSchema } from "@dreamlab/scene";
import { createInputField } from "../../util/easy-input.ts";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { DataTable } from "../../components/mod.ts";
import { InspectorUI } from "../inspector.ts";

export class BehaviorList {
  container = elem("div");

  editors = new Map<string, BehaviorEditor>();

  behaviors: SceneDescBehavior[] = [];

  game: ClientGame;

  constructor(
    ui: InspectorUI,
    public entity: Entity,
    public useEditorMetadata: boolean,
  ) {
    this.game = ui.game;

    if (useEditorMetadata) {
      const editorMetadata = entity.children
        .get("__EditorMetadata")
        ?.cast(EditorMetadataEntity);
      if (!editorMetadata) return;

      this.behaviors = SceneDescBehaviorSchema.array().parse(
        JSON.parse(editorMetadata.behaviorsJson),
      );

      this.game.values.on(ValueChanged, event => {
        if (event.value !== editorMetadata.values.get("behaviorsJson")) return;
        const newBehaviors = SceneDescBehaviorSchema.array().parse(
          JSON.parse(event.newValue as string),
        );

        for (const newBehavior of newBehaviors) {
          const existingEditor = this.editors.get(newBehavior.ref);
          if (existingEditor) {
            existingEditor.resolveUpdate(newBehavior);
          } else {
            const editor = new BehaviorEditor(ui, newBehavior, this);
            this.editors.set(newBehavior.ref, editor);
            this.behaviors.push(newBehavior);
          }
        }

        this.behaviors = this.behaviors.filter(oldBehavior => {
          // O(n*m) but n and m are small :)
          if (newBehaviors.find(it => it.ref === oldBehavior.ref) !== undefined) return true;
          const editor = this.editors.get(oldBehavior.ref);
          if (!editor) return true;
          this.editors.delete(oldBehavior.ref);
          editor.details.remove();
          return false;
        });
      });
    } else {
      // TODO: populate behaviors from entity data proper
    }

    this.#drawAddBehavior();

    for (const behavior of this.behaviors) {
      const editor = new BehaviorEditor(ui, behavior, this);
      this.editors.set(behavior.ref, editor);
    }
  }

  #drawAddBehavior() {
    const table = new DataTable();

    // deno-lint-ignore prefer-const
    let scriptField: HTMLInputElement;
    let script: string = "";

    let resolvedBehaviorType: BehaviorConstructor | undefined;
    const setScript = async (newScriptValue: string) => {
      script = newScriptValue;

      try {
        const behaviorType = await this.game.loadBehavior(script);
        if (resolvedBehaviorType === behaviorType) return;
        resolvedBehaviorType = behaviorType;
        scriptField.setCustomValidity("");
        scriptField.reportValidity();
      } catch (_err) {
        scriptField.setCustomValidity("Script URI could not be loaded");
        scriptField.reportValidity();
        return;
      }
    };

    [scriptField] = createInputField({
      get: () => script,
      set: setScript,
      convert: v => v,
    });
    scriptField.name = "script";

    table.addEntry("script", "Script", scriptField);
    table.addFullWidthEntry("add-behavior", elem("button", {}, ["Add Behavior"]));

    const form = elem("form", { id: "add-behavior" }, [table]);
    form.addEventListener("submit", event => {
      event.preventDefault();

      this.behaviors.push({
        ref: generateCUID("bhv"),
        script,
      });

      this.sync();
    });

    this.container.append(form);
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