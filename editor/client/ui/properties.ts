import {
  AnimatedSprite,
  ClientGame,
  Entity,
  EntityConstructor,
  EntityOwnEnableChanged,
  EntityRenamed,
  EntityReparented,
  EntityTransformUpdate,
  Vector2,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { element as elem } from "@dreamlab/ui";
import { z } from "@dreamlab/vendor/zod.ts";
import { Facades, PrefabRootFacade } from "../../common/mod.ts";
import { icon, X } from "../_icons.ts";
import { DataDetails, DataTable } from "../components/mod.ts";
import { UndoRedoManager } from "../undo-redo.ts";
import { createBooleanField, createInputField } from "../util/easy-input.ts";
import { createValueControl } from "../util/value-controls.ts";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

export class Properties implements InspectorUIWidget {
  #section = elem("section", { id: "properties" }, [elem("h1", {}, ["Properties"])]);

  constructor(private game: ClientGame) {}

  setup(ui: InspectorUI): void {
    const container = elem("div", { id: "properties-display" });
    container.style.display = "none";

    this.#section.append(container);

    const selectSomethingNotification = elem("p", { id: "select-something-notification" }, [
      "Select an entity to view its properties.",
    ]);

    this.#section.append(selectSomethingNotification);

    ui.selectedEntity.listen(() => {
      const entity = ui.selectedEntity.entities.at(0);

      if (entity) {
        selectSomethingNotification.style.display = "none";
        container.style.display = "flex";
        this.drawEntityProperties(container, entity);
      } else {
        container.style.display = "none";
        selectSomethingNotification.style.display = "block";
      }
    });
  }

  show(uiRoot: HTMLElement): void {
    const right = uiRoot.querySelector("#right-sidebar")!;
    right.prepend(this.#section);
  }

  hide(): void {
    this.#section.remove();
  }

  drawEntityProperties(container: HTMLElement, entity: Entity) {
    container.innerHTML = "";

    // TODO: clean up old listeners instead of leaking them
    // i think it would be easier if .on() gave u an object that u can .unsubscribe() on

    const table = new DataTable();
    container.append(table);

    let nameField: HTMLElement;
    let refreshName: (() => void) | undefined;

    const transformFieldsToRegisterWithUndoRedo: { field: HTMLInputElement; path: string[] }[] =
      [];

    if (entity.protected) {
      nameField = elem("code", {}, [entity.name]);
    } else {
      [nameField, refreshName] = createInputField({
        get: () => entity.name,
        set: name => (entity.name = name),
        convert: z.string().min(1).parse,
      });
      entity.on(EntityRenamed, refreshName);
      nameField.id = "rename-entity-input";

      let renameState: string | undefined;
      nameField.addEventListener("focus", () => {
        renameState = entity.name;
      });

      nameField.addEventListener("blur", () => {
        if (renameState === undefined) return;
        const previous = renameState;
        const newName = entity.name;
        renameState === undefined;

        if (newName !== previous) {
          UndoRedoManager._.push({
            t: "rename-entity",
            entityRef: entity.ref,
            previous,
            name: newName,
          });
        }
      });
    }

    table.addEntry("name", "Name", nameField);

    const entityId = () => entity.id.replace("game.world._.EditEntities._.", "game.");
    const idField = elem("code", {}, [entityId()]);
    entity.on(EntityRenamed, () => (idField.textContent = entityId()));
    entity.on(EntityReparented, () => (idField.textContent = entityId()));
    table.addEntry("id", "ID", idField);

    const typeField = elem("code", {}, [
      Facades.reverseFacadeEntityType(entity.constructor as EntityConstructor).name,
    ]);
    table.addEntry("type", "Type", typeField);

    if (!entity.protected) {
      const [enabledField, refreshEnabled] = createBooleanField({
        default: true,
        get: () => entity[internal.entityOwnEnabled],
        set: v => (entity.enabled = v),
      });
      entity.on(EntityOwnEnableChanged, () => refreshEnabled());
      table.addEntry("enabled", "Enabled", enabledField);
    }

    if (entity.parent instanceof PrefabRootFacade) {
      const button = elem("button", { type: "button" }, ["Update Instances"]);

      button.addEventListener("click", () => {
        for (const instance of [...this.game.entities]) {
          if (instance.clonedFromRef !== entity.ref) continue;

          const name = instance.name;
          const ref = instance.ref;
          const parent = instance.parent!;
          const { scale: _, ...transform } = instance.transform.bare();

          instance.destroy();
          entity.cloneInto(parent, { _ref: ref, name, transform });
        }
      });

      table.addEntry("prefab", "Prefab", button);
    }

    const clonedFrom = entity.clonedFromRef
      ? this.game.entities.lookupByRef(entity.clonedFromRef)
      : undefined;

    if (clonedFrom) {
      const valueDisplay = elem("code", {}, []);
      const clear = elem("button", { type: "button", title: "Unlink" }, [icon(X)]);
      const spacer = elem("div", { className: "spacer" });
      const control = elem("div", { className: "entity-inputs" }, [
        valueDisplay,
        spacer,
        clear,
      ]);

      valueDisplay.textContent = clonedFrom.id.replace("game.world._.EditEntities._.", "game.");
      clear.addEventListener("click", () => {
        entity.clonedFromRef = "";
        table.removeEntry("prefab-instance");
      });

      table.addEntry("prefab-instance", "Prefab Instance", control);
    }

    const transformSection = new DataDetails();
    container.append(transformSection);

    const position = elem("code");
    const updatePosition = () => {
      position.textContent = `(Global: ${entity.pos.x.toFixed(2)}, ${entity.pos.y.toFixed(2)})`;
    };
    updatePosition();
    entity.on(EntityTransformUpdate, updatePosition);
    transformSection.setHeaderContent(elem("h2", {}, ["Transform", " ", position]));

    const txfmTable = new DataTable();
    transformSection.addContent(txfmTable);

    const numeric = z.number({ coerce: true }).refine(Number.isFinite, "Value must be finite!");
    const [transformXField, refreshX] = createInputField({
      get: () => entity.transform.position.x,
      set: x => (entity.transform.position.x = x),
      convert: numeric.parse,
      convertBack: n => n.toFixed(4),
    });
    txfmTable.addEntry("posX", "Position X", transformXField);
    transformFieldsToRegisterWithUndoRedo.push({
      field: transformXField,
      path: ["position", "x"],
    });

    const [transformYField, refreshY] = createInputField({
      get: () => entity.transform.position.y,
      set: y => (entity.transform.position.y = y),
      convert: numeric.parse,
      convertBack: n => n.toFixed(4),
    });
    txfmTable.addEntry("posY", "Position Y", transformYField);
    transformFieldsToRegisterWithUndoRedo.push({
      field: transformYField,
      path: ["position", "y"],
    });

    const [transformRotation, refreshRotation] = createInputField({
      get: () => entity.transform.rotation,
      set: r => (entity.transform.rotation = r),
      convert: numeric.transform(v => (v * Math.PI) / 180).parse,
      convertBack: v => ((v * 180) / Math.PI).toFixed(1),
    });
    txfmTable.addEntry("rot", "Rotation", transformRotation);
    transformFieldsToRegisterWithUndoRedo.push({
      field: transformRotation,
      path: ["rotation"],
    });

    const [scaleXField, refreshScaleX] = createInputField({
      get: () => entity.transform.scale.x,
      set: x => (entity.transform.scale.x = x),
      convert: numeric.parse,
      convertBack: n => n.toFixed(4),
    });
    txfmTable.addEntry("scaleX", "Scale X", scaleXField);
    transformFieldsToRegisterWithUndoRedo.push({ field: scaleXField, path: ["scale", "x"] });

    const [scaleYField, refreshScaleY] = createInputField({
      get: () => entity.transform.scale.y,
      set: y => (entity.transform.scale.y = y),
      convert: numeric.parse,
      convertBack: n => n.toFixed(4),
    });
    txfmTable.addEntry("scaleY", "Scale Y", scaleYField);
    transformFieldsToRegisterWithUndoRedo.push({ field: scaleYField, path: ["scale", "y"] });

    const [zIndexField, refreshZIndex] = createInputField({
      get: () => entity.transform.z,
      set: z => (entity.transform.z = z),
      convert: numeric.refine(Number.isSafeInteger, "Number must be an integer!").parse,
      convertBack: n => n.toFixed(0),
    });
    txfmTable.addEntry("z", "Z Index", zIndexField);
    transformFieldsToRegisterWithUndoRedo.push({ field: zIndexField, path: ["z"] });

    entity.on(EntityTransformUpdate, () => {
      refreshX();
      refreshY();
      refreshRotation();
      refreshScaleX();
      refreshScaleY();
      refreshZIndex();
    });

    const count = [...entity.values.values()].filter(v => !v.hidden).length;
    if (count === 0) return;

    const valuesSection = new DataDetails();
    container.append(valuesSection);
    valuesSection.setHeaderContent(elem("h2", {}, ["Values"]));

    const valuesTable = new DataTable();
    valuesSection.addContent(valuesTable);

    for (const [key, value] of entity.values.entries()) {
      if (value.hidden) continue;

      const [valueField, refreshValue] = createValueControl(this.game, {
        id: `${entity.ref}/${key}`,
        typeTag: value.typeTag,
        get: () => value.value,
        set: v => (value.value = v),
        default: undefined,
        relatedEntity: entity,
      });

      let state: { value: unknown } | undefined = undefined;

      valueField.addEventListener("focus", () => {
        state = { value: value.value };
      });

      valueField.addEventListener("blur", () => {
        if (!state) return;
        const previous = state.value;
        state = undefined;
        if (value.value === previous) return;

        UndoRedoManager._.push({
          t: "modify-entity-value",
          entityRef: entity.ref,
          key,
          value: value.value,
          previous,
        });
      });

      valuesTable.addEntry(`value:${key}`, key, valueField);
      value.onChanged(refreshValue);
    }

    if (entity instanceof AnimatedSprite) {
      const button = elem("button", { type: "button" }, ["View Sheet Guide"]);

      button.addEventListener("click", () => {
        const spritesheet = entity.values.get("spritesheet")?.value;
        const frameCount = entity.values.get("frameCount")?.value as Vector2 | undefined;
        const framesX = frameCount?.x;
        const framesY = frameCount?.y;

        const spritesheetJSON = entity.values.get("jsonSpritesheet")?.value;
        if (
          typeof spritesheet === "string" &&
          spritesheet !== "" &&
          framesX !== 1 &&
          framesY !== 1
        ) {
          const url = this.game.resolveResource(spritesheet);
          const popupUrl = `/spriteguide.html?spritesheetUrl=${url}&frameX=${framesX}&frameY=${framesY}`;
          window.open(popupUrl, "_blank", "popup");
        } else if (typeof spritesheetJSON === "string" && spritesheetJSON !== "") {
          const url = this.game.resolveResource(spritesheetJSON);
          const popupUrl = `/spriteguide.html?spritesheetJson=${url}`;
          window.open(popupUrl, "_blank", "popup");
        } else {
          alert("Please set spritesheet (and frameWidth + frameHeight) or spritesheetJSON.");
        }
      });

      valuesTable.addEntry("spritesheetguide", "Guide", button);
    }

    for (const transformField of transformFieldsToRegisterWithUndoRedo) {
      let state: { value: unknown } | undefined = undefined;

      transformField.field.addEventListener("focus", () => {
        state = { value: transformField.field.value };
      });

      transformField.field.addEventListener("blur", () => {
        if (!state) return;
        const previous = state.value as string;
        state = undefined;
        if (transformField.field.value === previous) return;

        UndoRedoManager._.push({
          t: "modify-entity-transform",
          entityRef: entity.ref,
          path: transformField.path,
          value: transformField.field.value,
          previous,
        });
      });
    }
  }
}
