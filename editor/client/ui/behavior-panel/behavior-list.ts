import { ClientGame, Entity, ValueChanged } from "@dreamlab/engine";
import { SceneDescBehavior, BehaviorSchema as SceneDescBehaviorSchema } from "@dreamlab/scene";
import { element as elem } from "@dreamlab/ui";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { EditorMetadataEntity } from "../../../common/mod.ts";
import { DataTable } from "../../components/mod.ts";
import { createInputField } from "../../util/easy-input.ts";
import { InspectorUI } from "../inspector.ts";
import { BehaviorEditor } from "./behavior-editor.ts";

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

    this.#drawAddBehavior(ui);

    for (const behavior of this.behaviors) {
      const editor = new BehaviorEditor(ui, behavior, this);
      this.editors.set(behavior.ref, editor);
    }
  }

  #drawAddBehavior(ui: InspectorUI) {
    const table = new DataTable();
    const submitButton = elem("button", { type: "submit", disabled: true }, ["Add Behavior"]);

    // deno-lint-ignore prefer-const
    let scriptField: HTMLInputElement;
    let script: string = "";

    const setScript = async (newScriptValue: string) => {
      submitButton.disabled = true;
      script = newScriptValue;
      if (newScriptValue === "") {
        return;
      }

      try {
        await ui.behaviorTypeInfo.get(script);
        scriptField.setCustomValidity("");
        scriptField.reportValidity();
        submitButton.disabled = false;
      } catch (_err) {
        scriptField.setCustomValidity("Script URI could not be loaded");
        scriptField.reportValidity();
        submitButton.disabled = true;
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
    table.addFullWidthEntry("add-behavior", submitButton);

    const form = elem("form", { id: "add-behavior" }, [table]);
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (script === "") return;

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
