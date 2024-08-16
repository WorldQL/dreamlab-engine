import { element as elem } from "@dreamlab/ui";
import { SceneDescBehavior } from "@dreamlab/scene";

import { createInputField } from "../../util/easy-input.ts";
import { BehaviorList } from "./behavior-list.ts";
import {
  BehaviorConstructor,
  ClientGame,
  Empty,
  inferValueTypeTag,
  Value,
} from "@dreamlab/engine";
import { z } from "@dreamlab/vendor/zod.ts";
import { DataDetails, DataTable } from "../../components/mod.ts";
import { icon, Trash } from "../../_icons.ts";

type ThinValue<T> = {
  value: Value<T>["value"];
  typeTag?: Value<T>["typeTag"];
  adapter?: Value<T>["adapter"];
};
export class BehaviorEditor {
  details: DataDetails;

  valueFields = new Map<string, ReturnType<typeof createInputField>>();
  values: Record<string, ThinValue<unknown>> = {};

  constructor(
    public game: ClientGame,
    public behavior: SceneDescBehavior,
    private parent: BehaviorList,
  ) {
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

    this.game.loadBehavior(this.behavior.script).then(type => {
      this.details.setHeaderContent(elem("h2", {}, [type.name]), deleteButton);
      this.#populateValueFields(table, type);
    });
  }

  #populateValueFields(table: DataTable, behaviorType: BehaviorConstructor) {
    try {
      // TODO: sandboxing -- we should create a dummy ClientGame instance to spawn this behavior in,
      // so that it can't change anything about the edit-mode game.

      const dummyEntity = this.game.local.spawn({ type: Empty, name: "DummyBehaviorTarget" });
      const behaviorObj = dummyEntity.addBehavior({
        type: behaviorType,
        values: this.behavior.values,
      });

      for (const [key, value] of behaviorObj.values.entries()) {
        this.values[key] = {
          value: value.value,
          typeTag: value.typeTag,
          adapter: value.adapter,
        };
      }
      dummyEntity.destroy();
    } catch (_err) {
      // behavior values are unknown, just use what we have
      if (this.behavior.values) {
        for (const [key, value] of Object.entries(this.behavior.values)) {
          let typeTag: unknown | undefined = undefined;
          try {
            typeTag = inferValueTypeTag(value);
          } catch (_) {
            // ignore
          }

          this.values[key] = { value, typeTag };
        }
      }
    }

    for (const [key, value] of Object.entries(this.values)) {
      let valueField: ReturnType<typeof createInputField>;

      switch (value.typeTag) {
        case String: {
          const val = value as ThinValue<string>;
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
          break;
        }

        case Number: {
          const val = value as ThinValue<number>;
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
