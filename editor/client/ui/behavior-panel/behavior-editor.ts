import { SceneDescBehavior, ValueSchema } from "@dreamlab/scene";
import { element as elem } from "@dreamlab/ui";

import { ClientGame, Entity, Value } from "@dreamlab/engine";
import type * as z from "@dreamlab/vendor/zod.ts";
import { icon, Trash2 as Trash } from "../../_icons.tsx";
import { DataDetails, DataTable } from "../../components/mod.ts";
import { BehaviorTypeInfo } from "../../util/behavior-type-info.ts";
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

  valueFields = new Map<string, ReturnType<typeof createValueControl>>();
  values: Record<string, ThinValue<unknown>> = {};
  scriptElement: HTMLElement;

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

    // this.#table.addEntry("id", "ID", elem("code", {}, [behavior.ref]));
    this.scriptElement = elem("code", {}, [behavior.script]);
    this.#table.addEntry(
      "script",
      "Script",
      "Can be dragged from the project panel or typed with 'res://<path>'.",
      this.scriptElement,
    );

    this.scriptElement.addEventListener("dblclick", () => {
      window.parent.postMessage(
        {
          action: "goToTab",
          tab: "scripts",
          // TODO: how do we tell if we need .js or .tsx here?
          fileName: behavior.script.replace("res://", "").replace(/\.js$/, ".ts"),
        },
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
      const h2 = this.details.querySelector("h2");
      if (h2) h2.textContent = info.typeName;

      for (const value of info.values) {
        // check if incoming value has a different type tag
        const existingValue = this.values[value.key];
        if (existingValue && existingValue.typeTag !== value.typeTag) {
          // update type tag and remove existing inspector
          existingValue.typeTag = value.typeTag;
          this.#table.removeEntry(`value:${value.key}`);
          this.valueFields.delete(value.key);
        }

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

  #addValueField(key: string, value: ThinValue<unknown>) {
    const [control, refresh] = createValueControl(this.game, {
      id: `${this.behavior.ref}/${key}`,
      typeTag: value.typeTag,
      default: value.default,
      get: () => value.value,
      set: v => {
        value.value = v;
        if (!this.behavior.values) this.behavior.values = {};
        this.behavior.values[key] = v as z.infer<typeof ValueSchema>;

        // TODO: track child behaviors
        // TODO: propagate this down to avoid expensive tree walk
        // const getClonedFrom = (entity: Entity): string | undefined => {
        //   let e: Entity | undefined = entity;
        //   while (e !== undefined) {
        //     if (e.clonedFromRef !== "") return e.clonedFromRef;
        //     e = e.parent;
        //   }

        //   return undefined;
        // };

        // track override if the entity is is cloned from a prefab
        if (this.parent.entity.clonedFromRef !== "") {
          this.behavior.overrides ??= {};
          if (v) this.behavior.overrides[key] = v;
          else delete this.behavior.overrides[key];

          if (Object.keys(this.behavior.overrides).length === 0) {
            delete this.behavior.overrides;
          }
        }

        this.parent.sync();
      },
      relatedEntity: this.parent.entity,
    });

    this.valueFields.set(key, [control, refresh]);
    this.#table.addEntry(`value:${key}`, key, "", control);
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
      if (behaviorInfo && !value.typeTag) continue;
      this.#addValueField(key, value);
    }
  }

  resolveUpdate(newBehavior: SceneDescBehavior) {
    this.behavior.script = newBehavior.script;
    this.scriptElement.textContent = newBehavior.script;

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
