import { element as elem } from "@dreamlab/ui";
import { SceneDescBehavior } from "@dreamlab/scene";

import { createInputField, createInputFieldWithDefault } from "../../util/easy-input.ts";
import { BehaviorList } from "./behavior-list.ts";
import { ClientGame, Value } from "@dreamlab/engine";
import { z } from "@dreamlab/vendor/zod.ts";
import { DataDetails, DataTable } from "../../components/mod.ts";
import { icon, Trash } from "../../_icons.ts";
import { InspectorUI } from "../inspector.ts";
import { BehaviorTypeInfo } from "../../util/behavior-type-info.ts";

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

  constructor(
    ui: InspectorUI,
    public behavior: SceneDescBehavior,
    private parent: BehaviorList,
  ) {
    this.game = ui.game;

    const table = new DataTable();

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
    this.details.addContent(table);

    parent.container.append(this.details);

    table.addEntry("id", "ID", elem("code", {}, [behavior.ref]));
    table.addEntry("script", "Script", elem("code", {}, [behavior.script]));

    ui.behaviorTypeInfo
      .get(this.behavior.script)
      .then(info => {
        this.details.setHeaderContent(elem("h2", {}, [info.typeName]), deleteButton);
        this.#populateValueFields(table, info);
      })
      .catch(() => {
        this.details.setHeaderContent(
          elem("h2", {}, [elem("code", {}, [this.behavior.script])]),
          deleteButton,
        );
        this.#populateValueFields(table);
      });
  }

  #populateValueFields(table: DataTable, behaviorInfo?: BehaviorTypeInfo) {
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
      let valueField: ReturnType<typeof createInputField>;

      switch (value.typeTag) {
        case String: {
          const val = value as ThinValue<string>;
          if ("default" in val) {
            valueField = createInputFieldWithDefault({
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
            valueField = createInputField({
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
          break;
        }

        case Number: {
          const val = value as ThinValue<number>;
          if ("default" in val) {
            valueField = createInputFieldWithDefault({
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
            valueField = createInputField({
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
          break;
        }

        case undefined:
        default: {
          table.addEntry(
            `value:${key}`,
            key,
            elem("code", {}, ["Unknown: ", String(value.value)]),
          );
          continue;
        }
      }

      this.valueFields.set(key, valueField);
      table.addEntry(`value:${key}`, key, valueField[0]);
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
