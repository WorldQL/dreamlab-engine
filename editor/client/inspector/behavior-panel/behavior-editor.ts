import { element as elem } from "@dreamlab/ui";
import { SceneDescBehavior } from "@dreamlab/scene";

import * as internal from "../../../../engine/internal.ts";
import { createInputField } from "../../util/easy-input.ts";
import { BehaviorList } from "./behavior-list.ts";
import { ClientGame, Empty, inferValueTypeTag, Value } from "@dreamlab/engine";
import { z } from "@dreamlab/vendor/zod.ts";

export class BehaviorEditor {
  details: HTMLElement;

  scriptField: ReturnType<typeof createInputField>;
  valueFields = new Map<string, ReturnType<typeof createInputField>>();

  constructor(
    public game: ClientGame,
    public behavior: SceneDescBehavior,
    parent: BehaviorList,
  ) {
    const table = elem("table");
    this.details = elem("details", { open: true, className: "behavior" }, [
      elem("summary", {}, [elem("h2", {}, [behavior.script])]),
      table,
    ]);
    parent.container.append(this.details);

    const addEntry = (key: string, ...controls: HTMLElement[]) => {
      table.append(
        elem("tr", {}, [elem("th", {}, [key]), elem("td", { colSpan: 2 }, controls)]),
      );
    };

    addEntry("ID", elem("code", {}, [behavior.ref]));

    this.scriptField = createInputField({
      get: () => behavior.script,
      set: s => {
        behavior.script = s;
        parent.sync();
      },
      convert: v => v,
    });

    addEntry("Script", this.scriptField[0]);

    void this.#populateValueFields(table, parent);
  }

  async #populateValueFields(table: HTMLElement, parent: BehaviorList) {
    const addEntry = (key: string, ...controls: HTMLElement[]) => {
      table.append(
        elem("tr", {}, [elem("th", {}, [key]), elem("td", { colSpan: 2 }, controls)]),
      );
    };

    type ThinValue<T> = {
      value: Value<T>["value"];
      typeTag?: Value<T>["typeTag"];
      adapter?: Value<T>["adapter"];
    };
    const values: Record<string, ThinValue<unknown>> = {};

    try {
      // TODO: sandboxing -- we should create a dummy ClientGame instance to spawn this behavior in,
      // so that it can't change anything about the edit-mode game.

      const behaviorType = await this.game.loadBehavior(this.behavior.script);
      const dummyEntity = this.game.local.spawn({ type: Empty, name: "DummyBehaviorTarget" });
      const behaviorObj = new behaviorType({
        game: this.game,
        entity: dummyEntity,
        // @ts-expect-error: generic constraints
        values: this.behavior.values,
      });

      for (const [key, value] of behaviorObj.values.entries()) {
        values[key] = { value: value.value, typeTag: value.typeTag, adapter: value.adapter };
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

          values[key] = { value, typeTag };
        }
      }
    }

    for (const [key, value] of Object.entries(values)) {
      let valueField: ReturnType<typeof createInputField>;

      const [field, refresh] = createInputField({
        get: () => String(value.value),
        set: v => {
          value.value = v;
          if (!this.behavior.values) this.behavior.values = {};
          this.behavior.values[key] = v;
          parent.sync();
        },
        convert: s => s,
      });

      switch (value.typeTag) {
        case String: {
          const val = value as ThinValue<string>;
          valueField = createInputField({
            get: () => val.value,
            set: v => {
              val.value = v;
              if (!this.behavior.values) this.behavior.values = {};
              this.behavior.values[key] = v;
              parent.sync();
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
              parent.sync();
            },
            convert: z.number({ coerce: true }).parse,
          });
          break;
        }

        case undefined:
        default: {
          addEntry(key, elem("code", {}, ["Unknown: ", String(value.value)]));
          continue;
        }
      }

      this.valueFields.set(key, valueField);
      addEntry(key, valueField[0]);
    }
  }

  resolveUpdate(newBehavior: SceneDescBehavior) {
    this.behavior.script = newBehavior.script;
    this.scriptField[1]();

    for (const [key, value] of Object.entries(newBehavior.values ?? {})) {
      const valueField = this.valueFields.get(key);
      if (!valueField) {
        // TODO: render a new value field
        console.warn("need to render new value field -- not yet implemented");
        continue;
      }

      if (!this.behavior.values) this.behavior.values = {};
      this.behavior.values[key] = value;
      valueField[1]();
    }
  }
}
