import { BehaviorConstructor, ClientGame, Entity, JsonValue } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
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
    private ui: InspectorUI,
    public entity: Entity,
    public useEditorMetadata: boolean,
  ) {
    this.game = ui.game;

    this.container.addEventListener("dragover", event => {
      event.preventDefault();
    });

    this.container.addEventListener("drop", async event => {
      event.preventDefault();

      const dragTarget = document.querySelector(
        "[data-file][data-dragging]",
      ) as HTMLElement | null;
      if (!dragTarget) return;

      const file = dragTarget.dataset.file as string;
      const scriptPath = `res://${file}`;

      try {
        const info = await ui.behaviorTypeInfo.get(scriptPath);
        const values = Object.fromEntries(
          info.values.map(({ key }) => [key, undefined] as const),
        );

        const behavior = { ref: generateCUID("bhv"), script: scriptPath, values };
        this.behaviors.push(behavior);
        this.sync();
      } catch (error) {
        // FIXME: uhh catch onInitialize() throwing and deal with it better
        console.log(error);
      }
    });

    if (useEditorMetadata) {
      let editorMetadata = entity.children.get("__EditorMetadata")?.cast(EditorMetadataEntity);
      if (!editorMetadata) {
        editorMetadata = entity.spawn({
          type: EditorMetadataEntity,
          name: "__EditorMetadata",
        });
      }

      this.behaviors = SceneDescBehaviorSchema.array().parse(
        JSON.parse(editorMetadata.behaviorsJson),
      );

      editorMetadata.values.get("behaviorsJson")?.onChanged(newValue => {
        const newBehaviors = SceneDescBehaviorSchema.array().parse(
          JSON.parse(newValue as string),
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
      this.behaviors = [];
      for (const behavior of this.entity.behaviors) {
        const behaviorType = behavior.constructor as BehaviorConstructor;
        const script = this.game[internal.behaviorLoader].lookup(behaviorType);
        if (!script) continue;
        const values: SceneDescBehavior["values"] = {};
        for (const [key, value] of behavior.values.entries()) {
          values[key] = value.adapter
            ? value.adapter.convertToPrimitive(value.value)
            : (value.value as JsonValue);
        }

        this.behaviors.push({ ref: behavior.ref, script, values });
      }
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
      let editorMetadata = this.entity.children
        .get("__EditorMetadata")
        ?.cast(EditorMetadataEntity);

      if (!editorMetadata) {
        editorMetadata = this.entity.spawn({
          type: EditorMetadataEntity,
          name: "__EditorMetadata",
        });
      }

      editorMetadata.behaviorsJson = JSON.stringify(this.behaviors);
    } else {
      for (const behavior of this.behaviors) {
        const behaviorObj = this.entity.behaviors.find(b => b.ref === behavior.ref);
        if (behaviorObj === undefined) {
          this.game.loadBehavior(behavior.script).then(behaviorType => {
            // check if the behavior loaded while we were waiting for the promise:
            const newBehaviorObj = this.entity.behaviors.find(b => b.ref === behavior.ref);
            if (newBehaviorObj !== undefined) return;

            this.entity.addBehavior({
              _ref: behavior.ref,
              type: behaviorType,
              values: behavior.values,
            });
          });
        } else {
          console.log(behaviorObj, behavior.values);
          for (const [key, value] of Object.entries(behavior.values ?? {})) {
            const valueObj = behaviorObj.values.get(key);
            if (valueObj === undefined) continue;
            valueObj.value = valueObj.adapter
              ? valueObj.adapter.convertFromPrimitive(value as JsonValue)
              : value;
          }
        }
      }
    }
  }
}
