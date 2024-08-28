import { SceneDescBehavior, ValueSchema } from "@dreamlab/scene";
import { element as elem } from "@dreamlab/ui";

import { ClientGame, Value } from "@dreamlab/engine";
import { z } from "@dreamlab/vendor/zod.ts";
import { icon, Trash2 as Trash } from "../../_icons.ts";
import { DataDetails, DataTable } from "../../components/mod.ts";
import { BehaviorTypeInfo } from "../../util/behavior-type-info.ts";
import { createInputField, createInputFieldWithDefault } from "../../util/easy-input.ts";
import { createValueControl } from "../../util/value-controls.ts";
import { InspectorUI } from "../inspector.ts";
import { BehaviorList } from "./behavior-list.ts";

type ThinValue<T> = {
  value: Value<T>["value"] | undefined;
  default?: Value<T>["value"];
  typeTag?: Value<T>["typeTag"];
};
export class BehaviorEditor {
  details: DataDetails;

  valueFields = new Map<string, ReturnType<typeof createInputField>>();
  values: Record<string, ThinValue<unknown>> = {};

  game: ClientGame;

  #table = new DataTable();

  constructor(
    ui: InspectorUI,
    public behavior: SceneDescBehavior,
    private parent: BehaviorList,
  ) {
    this.game = ui.game;

    const deleteButton = elem(
      "a",
      { className: "delete-button", role: "button", href: "javascript:void(0)" },
      [icon(Trash)],
    );
    deleteButton.addEventListener("click", event => {
      event.preventDefault();
      // TODO: we should "are you sure?" on this lol

      this.details.remove();

      const idx = parent.behaviors.indexOf(behavior);
      if (idx !== -1) parent.behaviors.splice(idx, 1);

      parent.sync();
    });

    this.details = new DataDetails();
    this.details.className = "behavior";
    this.details.setHeaderContent(elem("h2", {}, ["[loading]"]), deleteButton);
    this.details.addContent(this.#table);

    parent.container.append(this.details);

    this.#table.addEntry("id", "ID", elem("code", {}, [behavior.ref]));
    const scriptElement = elem("code", {}, [behavior.script]);
    this.#table.addEntry("script", "Script", scriptElement);

    scriptElement.addEventListener("dblclick", () => {
      window.parent.postMessage(
        { action: "goToTab", tab: "scripts", fileName: behavior.script.replace("res://", "") },
        "*",
      );
    });

    ui.behaviorTypeInfo
      .get(this.behavior.script)
      .then(info => {
        this.details.setHeaderContent(elem("h2", {}, [info.typeName]), deleteButton);
        this.#populateValueFields(info);
      })
      .catch(() => {
        this.details.setHeaderContent(
          elem("h2", {}, [elem("code", {}, [this.behavior.script])]),
          deleteButton,
        );
        this.#populateValueFields();
      });
  }

  async updateTypeInfo(ui: InspectorUI) {
    try {
      const info = await ui.behaviorTypeInfo.get(this.behavior.script);
      for (const value of info.values) {
        if (this.valueFields.has(value.key)) continue;

        // TODO: add the value to the data model and create a new field

        let currentValue: unknown | undefined = value.default;
        if (this.behavior.values) currentValue = this.behavior.values[value.key];
        const thinValue = {
          value: currentValue,
          default: value.default,
          typeTag: value.typeTag,
        };
        this.values[value.key] = thinValue;
        this.#addValueField(value.key, thinValue);
      }

      for (const key of this.valueFields.keys()) {
        if (info.values.find(it => it.key === key) !== undefined) continue;

        this.#table.removeEntry(`value:${key}`);
        this.valueFields.delete(key);

        // XXX: i don't think we want to actually do this, because we lose user-inputted data.
        // if the value was removed from the script in error you should be able to put it back and get your values back

        // delete this.values[key];
      }

      this.#table.reorderEntries(["id", "script", ...info.values.map(v => `value:${v.key}`)]);
    } catch {
      // ignore
    }
  }

  // TODO: replace with an abstraction we can use for both Properties and BehaviorEditor
  #createValueField(
    key: string,
    value: ThinValue<unknown>,
  ): ReturnType<typeof createInputField> | undefined {
    switch (value.typeTag) {
      case String: {
        const val = value as ThinValue<string>;
        if ("default" in val) {
          return createInputFieldWithDefault({
            default: val.default,
            get: () => val.value,
            set: v => {
              val.value = v;
              if (!this.behavior.values) this.behavior.values = {};
              this.behavior.values[key] = v;
              this.parent.sync();
            },
            convert: s => s,
          });
        } else {
          return createInputField({
            get: () => val.value,
            set: v => {
              val.value = v;
              if (!this.behavior.values) this.behavior.values = {};
              this.behavior.values[key] = v;
              this.parent.sync();
            },
            convert: s => s,
          });
        }
      }

      case Number: {
        const val = value as ThinValue<number>;
        if ("default" in val) {
          return createInputFieldWithDefault({
            default: val.default,
            get: () => val.value,
            set: v => {
              val.value = v;
              if (!this.behavior.values) this.behavior.values = {};
              this.behavior.values[key] = v;
              this.parent.sync();
            },
            convert: z.number({ coerce: true }).parse,
          });
        } else {
          return createInputField({
            get: () => val.value,
            set: v => {
              val.value = v;
              if (!this.behavior.values) this.behavior.values = {};
              this.behavior.values[key] = v;
              this.parent.sync();
            },
            convert: z.number({ coerce: true }).parse,
          });
        }
      }

      case undefined:
      default: {
        return undefined;
      }
    }
  }

  #addValueField(key: string, value: ThinValue<unknown>) {
    const [control, refresh] = createValueControl(this.game, {
      typeTag: value.typeTag,
      default: value.default,
      get: () => value.value,
      set: v => {
        value.value = v;
        if (!this.behavior.values) this.behavior.values = {};
        this.behavior.values[key] = v as z.infer<typeof ValueSchema>;
        this.parent.sync();
      },
    });

    if (control instanceof HTMLInputElement) this.valueFields.set(key, [control, refresh]);
    this.#table.addEntry(`value:${key}`, key, control);
  }

  #populateValueFields(behaviorInfo?: BehaviorTypeInfo) {
    if (behaviorInfo) {
      for (const value of behaviorInfo.values) {
        let currentValue: unknown | undefined = value.default;
        if (this.behavior.values) currentValue = this.behavior.values[value.key];

        this.values[value.key] = {
          value: currentValue,
          default: value.default,
          typeTag: value.typeTag,
        };
      }
    }

    if (this.behavior.values) {
      for (const [key, value] of Object.entries(this.behavior.values)) {
        if (!this.values[key]) {
          this.values[key] = { value };
        }
      }
    }

    for (const [key, value] of Object.entries(this.values)) {
      this.#addValueField(key, value);
    }
  }

  resolveUpdate(newBehavior: SceneDescBehavior) {
    this.behavior.script = newBehavior.script;

    for (const [key, value] of Object.entries(newBehavior.values ?? {})) {
      const valueField = this.valueFields.get(key);
      if (!valueField) {
        // TODO: render a new value field
        console.warn("need to render new value field -- not yet implemented");
        continue;
      }

      this.values[key].value = value;
      if (!this.behavior.values) this.behavior.values = {};
      this.behavior.values[key] = value;
      valueField[1]();
    }
  }
}
