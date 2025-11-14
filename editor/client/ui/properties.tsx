import {
  AnimatedSprite,
  ClientGame,
  ColorAdapter,
  Entity,
  EntityConstructor,
  EntityOwnEnableChanged,
  EntityRenamed,
  EntityReparented,
  EntityTransformUpdate,
  JsonValue,
  RenderContainer,
  SignalSubscription,
  Vector2,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import type { SceneDescBehavior } from "@dreamlab/scene";
import { BaseElement, element as elem } from "@dreamlab/ui";
import * as z from "@dreamlab/vendor/zod.ts";
import { EditorFacadeTilemap } from "../../common/facades/tilemap.ts";
import { EditorMetadataEntity, Facades, PrefabRootFacade } from "../../common/mod.ts";
import { icon, X } from "../_icons.tsx";
import { DataDetails, DataTable } from "../components/mod.ts";
import { UndoRedoManager } from "../undo-redo.ts";
import { createBooleanField, createInputField } from "../util/easy-input.ts";
import { createValueControl } from "../util/value-controls.ts";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

export class Properties implements InspectorUIWidget {
  #section = (
    <section id="properties">
      <h1
        title="Entity Properties - select an entity to inspect or edit its name, transform, and values."
        ariaLabel="Entity Properties - select an entity to inspect or edit its name, transform, and values."
      >
        Properties
      </h1>
    </section>
  );

  constructor(private game: ClientGame) {}

  setup(ui: InspectorUI): void {
    const container = <div id="properties-display" style={{ display: "none" }} />;
    this.#section.append(container);

    const selectSomethingNotification = (
      <p id="select-something-notification">Select an entity to view its properties.</p>
    );

    this.#section.append(selectSomethingNotification);

    const teardown: (() => void)[] = [];
    ui.selectedEntity.listen(() => {
      const entities = Array.from(ui.selectedEntity.entities);

      teardown.forEach(it => it());
      teardown.length = 0;

      if (entities.length > 0) {
        selectSomethingNotification.style.display = "none";
        container.style.display = "flex";
        this.drawEntityProperties(container, entities);

        for (const entity of entities) {
          const prefabInstanceChanged = () => this.drawEntityProperties(container, entities);
          entity.values.get("clonedFromRef")!.onChanged(prefabInstanceChanged);
          teardown.push(() => {
            entity.values.get("clonedFromRef")!.removeChangeListener(prefabInstanceChanged);
          });
        }
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

  entityPropertyTeardown: (() => void)[] = [];

  drawEntityProperties(container: BaseElement, entities: Entity[]) {
    container.innerHTML = "";

    this.entityPropertyTeardown.forEach(it => it());
    this.entityPropertyTeardown.length = 0;
    // deno-lint-ignore no-explicit-any
    const autoCleanup = (s: SignalSubscription<any>) =>
      this.entityPropertyTeardown.push(s.unsubscribe);

    if (entities.length > 1) {
      this.drawMultiEntityProperties(container, entities, autoCleanup);
      return;
    }

    const entity = entities[0];

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
      autoCleanup(entity.on(EntityRenamed, refreshName));
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

    table.addEntry(
      "name",
      "Name",
      "Display name shown in the editor and hierarchy.",
      nameField,
    );
    const entityId = () => entity.id.replace("world/EditEntities/", "");
    const idField = elem("code", {}, [entityId()]);
    autoCleanup(entity.on(EntityRenamed, () => (idField.textContent = entityId())));
    autoCleanup(
      entity.on(EntityReparented, () => {
        queueMicrotask(() => {
          idField.textContent = entityId();
        });
      }),
    );
    table.addEntry("id", "ID", "Unique path / reference inside the world.", idField);

    const typeField = elem("code", {}, [
      Facades.reverseFacadeEntityType(entity.constructor as EntityConstructor).name,
    ]);
    table.addEntry("type", "Type", "Engine class for this entity.", typeField);

    if (entity.id === "world/EditEntities/server") {
      const button = elem("button", { type: "button", className: "clear-feedback" }, [
        "Clear KV Data",
      ]);

      button.addEventListener("click", () => {
        this.game.network.sendCustomMessage("server", "@kv/clear", {});
        this.game.kv.player.clear();

        button.textContent = "Cleared!";
        button.classList.add("cleared");

        setTimeout(() => {
          button.textContent = "Clear KV Data";
          button.classList.remove("cleared");
        }, 3000);
      });

      table.addEntry(
        "Clear KV Data",
        "KV",
        "Erase all key-value data stored on the server and player for this project.",
        button,
      );
    }

    if (!entity.protected) {
      const [enabledField, refreshEnabled] = createBooleanField({
        default: true,
        get: () => entity[internal.entityOwnEnabled],
        set: v => (entity.enabled = v),
      });
      autoCleanup(entity.on(EntityOwnEnableChanged, () => refreshEnabled()));
      table.addEntry(
        "enabled",
        "Enabled",
        "Toggle whether the entity is active; disabled entities don't render",
        enabledField,
      );

      const metadata = EditorMetadataEntity.getInstanceFor(entity);
      if (metadata) {
        const [lockedField, refreshLocked] = createBooleanField({
          default: false,
          get: () => metadata.locked,
          set: v => {
            const prevLocked = metadata.locked;
            metadata.locked = v;
            UndoRedoManager._.push({
              t: "modify-entity-locked",
              entityRef: entity.ref,
              locked: v,
              previous: prevLocked,
            });
            refreshLocked();
          },
        });

        table.addEntry(
          "locked",
          "Locked",
          "Prevent selecting this entity until it's unlocked.",
          lockedField,
        );
      }
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

          const editorMetadata = EditorMetadataEntity.getInstanceFor(instance);
          const behaviors: SceneDescBehavior[] = JSON.parse(editorMetadata.behaviorsJson);

          const behaviorOverrides: Record<string, Record<string, JsonValue>> = {};
          for (const behavior of behaviors) {
            if (!behavior.overrides) continue;

            for (const [key, value] of Object.entries(behavior.overrides)) {
              behaviorOverrides[behavior.script] ??= {};
              behaviorOverrides[behavior.script][key] = value;
            }
          }

          instance.destroy();
          const cloned = entity.cloneInto(parent, { _ref: ref, name, transform });
          if (Object.keys(behaviorOverrides).length === 0) return;

          const clonedMetadata = EditorMetadataEntity.getInstanceFor(cloned);
          const clonedBehaviors: SceneDescBehavior[] = JSON.parse(clonedMetadata.behaviorsJson);

          for (const [script, overrides] of Object.entries(behaviorOverrides)) {
            const behavior = clonedBehaviors.find(bhv => bhv.script === script);
            if (!behavior) continue;

            behavior.overrides = overrides;
            for (const [k, v] of Object.entries(overrides)) {
              behavior.values ??= {};
              behavior.values[k] = v;
            }
          }

          clonedMetadata.behaviorsJson = JSON.stringify(clonedBehaviors);
        }
      });

      table.addEntry(
        "prefab",
        "Prefab",
        "Push current prefab changes to every instance in the scene.",
        button,
      );
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

      valueDisplay.textContent = clonedFrom.id.replace("world/EditEntities/", "");
      clear.addEventListener("click", () => {
        UndoRedoManager._.push({
          t: "modify-entity-value",
          entityRef: entity.ref,
          key: "clonedFromRef",
          previous: entity.clonedFromRef,
          value: "",
        });
        entity.clonedFromRef = "";
      });

      table.addEntry("prefab-instance", "Prefab Instance", "", control);
    }

    if (!entity.protected) {
      const transformSection = new DataDetails();
      container.append(transformSection);
      transformSection.setHeaderContent(elem("h2", {}, ["Transform"]));

      const txfmTable = new DataTable();
      transformSection.addContent(txfmTable);

      const numeric = z.coerce.number().refine(Number.isFinite, "Value must be finite!");
      const [transformXField, refreshX] = createInputField({
        get: () => entity.transform.position.x,
        set: x => (entity.transform.position.x = x),
        convert: numeric.parse,
        convertBack: n => n.toFixed(4),
      });
      txfmTable.addEntry(
        "posX",
        "Position X",
        "Local X coordinates relative to the parent.",
        transformXField,
      );
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
      txfmTable.addEntry(
        "posY",
        "Position Y",
        "Local Y coordinates relative to the parent.",
        transformYField,
      );
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
      txfmTable.addEntry("rot", "Rotation", "Local rotation in degrees.", transformRotation);
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
      txfmTable.addEntry("scaleX", "Scale X", "Local X scale factors.", scaleXField);
      transformFieldsToRegisterWithUndoRedo.push({ field: scaleXField, path: ["scale", "x"] });

      const [scaleYField, refreshScaleY] = createInputField({
        get: () => entity.transform.scale.y,
        set: y => (entity.transform.scale.y = y),
        convert: numeric.parse,
        convertBack: n => n.toFixed(4),
      });
      txfmTable.addEntry("scaleY", "Scale Y", "Local Y scale factors.", scaleYField);
      transformFieldsToRegisterWithUndoRedo.push({ field: scaleYField, path: ["scale", "y"] });

      const [zIndexField, refreshZIndex] = createInputField({
        get: () => entity.transform.z,
        set: z => (entity.transform.z = z),
        convert: numeric.refine(Number.isSafeInteger, "Number must be an integer!").parse,
        convertBack: n => n.toFixed(0),
      });
      txfmTable.addEntry(
        "z",
        "Z Index",
        "Local draw-order; higher values render above lower ones.",
        zIndexField,
      );
      transformFieldsToRegisterWithUndoRedo.push({ field: zIndexField, path: ["z"] });

      autoCleanup(
        entity.on(EntityTransformUpdate, () => {
          refreshX();
          refreshY();
          refreshRotation();
          refreshScaleX();
          refreshScaleY();
          refreshZIndex();
        }),
      );

      const toggleGlobalTransformButton = elem("button", { type: "button" }, [
        "Show Global Transform",
      ]);
      container.append(toggleGlobalTransformButton);

      const globalTransformSection = elem(
        "section",
        { id: "global-transform", style: { display: "none" } },
        [],
      );
      container.append(globalTransformSection);

      globalTransformSection.append(elem("h2", {}, ["Global Transform"]));

      const globalTransformTable = new DataTable();
      globalTransformSection.append(globalTransformTable);

      const globalPosXField = elem("code", {}, [entity.pos.x.toFixed(2)]);
      globalTransformTable.addEntry(
        "global-pos-x",
        "Position X",
        "World-space X coordinates.",
        globalPosXField,
      );

      const globalPosYField = elem("code", {}, [entity.pos.y.toFixed(2)]);
      globalTransformTable.addEntry(
        "global-pos-y",
        "Position Y",
        "World-space Y coordinates.",
        globalPosYField,
      );

      const globalRotationField = elem("code", {}, [
        entity.globalTransform.rotation.toFixed(2),
      ]);
      globalTransformTable.addEntry(
        "global-rot",
        "Rotation",
        "World-space rotation in degrees.",
        globalRotationField,
      );

      const globalScaleXField = elem("code", {}, [entity.globalTransform.scale.x.toFixed(2)]);
      globalTransformTable.addEntry(
        "global-scale-x",
        "Scale X",
        "World-space X scale factors.",
        globalScaleXField,
      );

      const globalScaleYField = elem("code", {}, [entity.globalTransform.scale.y.toFixed(2)]);
      globalTransformTable.addEntry(
        "global-scale-y",
        "Scale Y",
        "World-space Y scale factors.",
        globalScaleYField,
      );

      const globalZField = elem("code", {}, [entity.z.toFixed(0)]);
      globalTransformTable.addEntry(
        "global-z",
        "Z Index",
        "World-space draw-order.",
        globalZField,
      );

      autoCleanup(
        entity.on(EntityTransformUpdate, () => {
          globalPosXField.textContent = entity.pos.x.toFixed(2);
          globalPosYField.textContent = entity.pos.y.toFixed(2);
          globalRotationField.textContent = entity.globalTransform.rotation.toFixed(2);
          globalScaleXField.textContent = entity.globalTransform.scale.x.toFixed(2);
          globalScaleYField.textContent = entity.globalTransform.scale.y.toFixed(2);
          globalZField.textContent = entity.z.toFixed(0);
        }),
      );

      toggleGlobalTransformButton.addEventListener("click", () => {
        if (globalTransformSection.style.display === "none") {
          globalTransformSection.style.display = "block";
          toggleGlobalTransformButton.textContent = "Hide Global Transform";
        } else {
          globalTransformSection.style.display = "none";
          toggleGlobalTransformButton.textContent = "Show Global Transform";
        }
      });
    }

    const valuesSection = new DataDetails();
    container.append(valuesSection);
    valuesSection.setHeaderContent(elem("h2", {}, ["Values"]));

    const valuesTable = new DataTable();
    valuesSection.addContent(valuesTable);

    const entries = entity.values
      .entries()
      .toArray()
      .toSorted(([, a], [, b]) => {
        if (a.sortOrder === b.sortOrder) {
          return 0;
        }

        return b.sortOrder - a.sortOrder;
      });

    for (const [key, value] of entries) {
      const [valueField, refreshValue] = createValueControl(this.game, {
        id: `${entity.ref}/${key}`,
        typeTag: value.typeTag,
        get: () => value.value,
        set: v => (value.value = v),
        default: undefined,
        relatedEntity: entity,
      });

      let state: { value: unknown } | undefined = undefined;

      const inputField =
        value.adapter instanceof ColorAdapter ? valueField.querySelector("input")! : valueField;

      const begin = () => {
        state = { value: structuredClone(value.value) };
      };

      inputField.addEventListener("focus", begin);
      valueField.addEventListener("input-begin", begin);

      const update = () => {
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
      };

      inputField.addEventListener("blur", update);
      valueField.addEventListener("input-finalize", update);

      valuesTable.addEntry(`value:${key}`, key, value.description, valueField);
      value.onChanged(refreshValue);
      this.entityPropertyTeardown.push(() => value.removeChangeListener(refreshValue));
    }

    // TODO: Move this into AnimatedSprite once we have a way to define button actions in the entities.
    if (entity instanceof AnimatedSprite) {
      const button = elem("button", { type: "button" }, ["View Sheet Guide"]);

      button.addEventListener("click", () => {
        const spritesheet = entity.values.get("spritesheet")?.value;
        const frameCount = entity.values.get("frameDimensions")?.value as Vector2 | undefined;
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

      valuesTable.addEntry("spritesheetguide", "Guide", "", button);
    }

    if (entity instanceof EditorFacadeTilemap) {
      const button = elem("button", { type: "button" }, ["Clear All Tiles"]);

      button.addEventListener("click", () => {
        const action = confirm("Are you sure?\nThis cannot be undone.");
        if (action) entity.clearTiles();
      });

      valuesTable.addEntry("clear", "tiles", "Clear all tiles for this entity", button);
    }

    if (entity instanceof RenderContainer) {
      const button = elem("button", { type: "button" }, ["Refresh"]);

      button.addEventListener("click", () => {
        entity.refresh();
      });

      valuesTable.addEntry("refresh", "refresh", "Refresh render container", button);
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

    const updateHiddenStates = () => {
      let hiddenCount = 0;
      for (const [id, element] of valuesTable.entries) {
        if (!id.startsWith("value:")) continue;
        const v = entity.values.get(id.replace("value:", ""));
        if (!v) continue;

        const hidden = typeof v.hidden === "boolean" ? v.hidden : v.hidden(entity.values);
        if (hidden) element.dataset.hidden = "";
        else delete element.dataset.hidden;

        if (hidden) hiddenCount += 1;
      }

      if (hiddenCount === entity.values.size) valuesSection.dataset.hidden = "";
      else delete valuesSection.dataset.hidden;
    };

    entity.values.forEach(value => value.onChanged(updateHiddenStates));
    this.entityPropertyTeardown.push(() => {
      entity.values.forEach(value => value.removeChangeListener(updateHiddenStates));
    });
    updateHiddenStates();
  }

  drawMultiEntityProperties(
    container: BaseElement,
    entities: Entity[],
    // deno-lint-ignore no-explicit-any
    autoCleanup: (s: SignalSubscription<any>) => void,
  ) {
    const summarySection = new DataDetails();
    container.append(summarySection);
    summarySection.setHeaderContent(elem("h2", {}, ["Multi-Selection"]));

    const summaryTable = new DataTable();
    summarySection.addContent(summaryTable);

    const countField = elem("code", {}, [`${entities.length} entities`]);
    summaryTable.addEntry("count", "Count", "Number of selected entities", countField);

    const namesList = elem(
      "div",
      { className: "multi-entity-names" },
      entities.map(e => elem("div", { className: "entity-name-item" }, [e.name])),
    );
    summaryTable.addEntry("entities", "Entities", "List of selected entities", namesList);

    const firstType = entities[0].constructor;
    const allSameType = entities.every(e => e.constructor === firstType);
    const typeField = elem("code", {}, [
      allSameType
        ? Facades.reverseFacadeEntityType(firstType as EntityConstructor).name
        : "Mixed Types",
    ]);
    summaryTable.addEntry("type", "Type", "Entity type(s)", typeField);

    const allProtected = entities.every(e => e.protected);
    if (!allProtected) {
      const batchOpsSection = new DataDetails();
      container.append(batchOpsSection);
      batchOpsSection.setHeaderContent(elem("h2", {}, ["Batch Operations"]));

      const batchOpsTable = new DataTable();
      batchOpsSection.addContent(batchOpsTable);

      const [enabledField, refreshEnabled] = createBooleanField({
        default: true,
        get: () => entities.every(e => e[internal.entityOwnEnabled]),
        set: v => {
          for (const entity of entities) {
            if (!entity.protected) {
              entity.enabled = v;
            }
          }
        },
      });

      for (const entity of entities) {
        autoCleanup(entity.on(EntityOwnEnableChanged, () => refreshEnabled()));
      }

      batchOpsTable.addEntry(
        "enabled-all",
        "Enable All",
        "Toggle whether all entities are active",
        enabledField,
      );
    }

    const transformSection = new DataDetails();
    container.append(transformSection);
    transformSection.setHeaderContent(elem("h2", {}, ["Transform (Common)"]));

    const txfmTable = new DataTable();
    transformSection.addContent(txfmTable);

    const numeric = z.coerce.number().refine(Number.isFinite, "Value must be finite!");

    const getValue = <T,>(getter: (e: Entity) => T): T | "multiple" => {
      const values = entities.map(getter);
      const first = values[0];
      return values.every(v => v === first) ? first : "multiple";
    };

    const transformFieldsToRegisterWithUndoRedo: { field: HTMLInputElement; path: string[] }[] =
      [];

    const [transformXField, refreshX] = createInputField({
      get: () => {
        const val = getValue(e => e.transform.position.x);
        return val === "multiple" ? NaN : val;
      },
      set: x => {
        for (const entity of entities) {
          if (!entity.protected) entity.transform.position.x = x;
        }
      },
      convert: numeric.parse,
      convertBack: n => (Number.isNaN(n) ? "Multiple values" : n.toFixed(4)),
    });
    txfmTable.addEntry(
      "posX",
      "Position X",
      "Local X coordinates relative to parent",
      transformXField,
    );
    transformFieldsToRegisterWithUndoRedo.push({
      field: transformXField,
      path: ["position", "x"],
    });

    const [transformYField, refreshY] = createInputField({
      get: () => {
        const val = getValue(e => e.transform.position.y);
        return val === "multiple" ? NaN : val;
      },
      set: y => {
        for (const entity of entities) {
          if (!entity.protected) entity.transform.position.y = y;
        }
      },
      convert: numeric.parse,
      convertBack: n => (Number.isNaN(n) ? "Multiple values" : n.toFixed(4)),
    });
    txfmTable.addEntry(
      "posY",
      "Position Y",
      "Local Y coordinates relative to parent",
      transformYField,
    );
    transformFieldsToRegisterWithUndoRedo.push({
      field: transformYField,
      path: ["position", "y"],
    });

    const [transformRotation, refreshRotation] = createInputField({
      get: () => {
        const val = getValue(e => e.transform.rotation);
        return val === "multiple" ? NaN : val;
      },
      set: r => {
        for (const entity of entities) {
          if (!entity.protected) entity.transform.rotation = r;
        }
      },
      convert: numeric.transform(v => (v * Math.PI) / 180).parse,
      convertBack: v =>
        Number.isNaN(v) ? "Multiple values" : ((v * 180) / Math.PI).toFixed(1),
    });
    txfmTable.addEntry("rot", "Rotation", "Local rotation in degrees", transformRotation);
    transformFieldsToRegisterWithUndoRedo.push({
      field: transformRotation,
      path: ["rotation"],
    });

    const [scaleXField, refreshScaleX] = createInputField({
      get: () => {
        const val = getValue(e => e.transform.scale.x);
        return val === "multiple" ? NaN : val;
      },
      set: x => {
        for (const entity of entities) {
          if (!entity.protected) entity.transform.scale.x = x;
        }
      },
      convert: numeric.parse,
      convertBack: n => (Number.isNaN(n) ? "Multiple values" : n.toFixed(4)),
    });
    txfmTable.addEntry("scaleX", "Scale X", "Local X scale factors", scaleXField);
    transformFieldsToRegisterWithUndoRedo.push({ field: scaleXField, path: ["scale", "x"] });

    const [scaleYField, refreshScaleY] = createInputField({
      get: () => {
        const val = getValue(e => e.transform.scale.y);
        return val === "multiple" ? NaN : val;
      },
      set: y => {
        for (const entity of entities) {
          if (!entity.protected) entity.transform.scale.y = y;
        }
      },
      convert: numeric.parse,
      convertBack: n => (Number.isNaN(n) ? "Multiple values" : n.toFixed(4)),
    });
    txfmTable.addEntry("scaleY", "Scale Y", "Local Y scale factors", scaleYField);
    transformFieldsToRegisterWithUndoRedo.push({ field: scaleYField, path: ["scale", "y"] });

    const [zIndexField, refreshZIndex] = createInputField({
      get: () => {
        const val = getValue(e => e.transform.z);
        return val === "multiple" ? NaN : val;
      },
      set: z => {
        for (const entity of entities) {
          if (!entity.protected) entity.transform.z = z;
        }
      },
      convert: numeric.refine(Number.isSafeInteger, "Number must be an integer!").parse,
      convertBack: n => (Number.isNaN(n) ? "Multiple values" : n.toFixed(0)),
    });
    txfmTable.addEntry(
      "z",
      "Z Index",
      "Local draw-order; higher values render above lower ones",
      zIndexField,
    );
    transformFieldsToRegisterWithUndoRedo.push({ field: zIndexField, path: ["z"] });

    for (const entity of entities) {
      autoCleanup(
        entity.on(EntityTransformUpdate, () => {
          refreshX();
          refreshY();
          refreshRotation();
          refreshScaleX();
          refreshScaleY();
          refreshZIndex();
        }),
      );
    }

    for (const transformField of transformFieldsToRegisterWithUndoRedo) {
      let state: { values: Map<string, string> } | undefined = undefined;

      transformField.field.addEventListener("focus", () => {
        state = { values: new Map(entities.map(e => [e.ref, transformField.field.value])) };
      });

      transformField.field.addEventListener("blur", () => {
        if (!state) return;
        const previous = state.values;
        state = undefined;
        if (transformField.field.value === previous.values().next().value) return;

        for (const entity of entities) {
          if (entity.protected) continue;
          UndoRedoManager._.push({
            t: "modify-entity-transform",
            entityRef: entity.ref,
            path: transformField.path,
            value: transformField.field.value,
            previous: previous.get(entity.ref) || "",
          });
        }
      });
    }

    const valuesSection = new DataDetails();
    container.append(valuesSection);
    valuesSection.setHeaderContent(elem("h2", {}, ["Values (Common)"]));

    const valuesTable = new DataTable();
    valuesSection.addContent(valuesTable);

    const firstEntity = entities[0];
    const commonValueKeys = Array.from(firstEntity.values.keys()).filter(key =>
      entities.every(e => e.values.has(key)),
    );

    const commonEntries = commonValueKeys
      .map(key => [key, firstEntity.values.get(key)!] as const)
      .toSorted(([, a], [, b]) => {
        if (a.sortOrder === b.sortOrder) return 0;
        return b.sortOrder - a.sortOrder;
      });

    for (const [key, firstValue] of commonEntries) {
      const allSameValue = entities.every(e => {
        const val = e.values.get(key);
        return val && JSON.stringify(val.value) === JSON.stringify(firstValue.value);
      });

      const [valueField, refreshValue] = createValueControl(this.game, {
        id: `multi/${key}`,
        typeTag: firstValue.typeTag,
        get: () => {
          if (allSameValue) return firstValue.value;
          return firstValue.value;
        },
        set: v => {
          for (const entity of entities) {
            const val = entity.values.get(key);
            if (val) val.value = v;
          }
        },
        default: undefined,
        relatedEntity: firstEntity,
      });

      const inputField =
        firstValue.adapter instanceof ColorAdapter
          ? valueField.querySelector("input")!
          : valueField;

      let state: { values: Map<string, unknown> } | undefined = undefined;

      const begin = () => {
        state = {
          values: new Map<string, unknown>(
            entities.map(
              e => [e.ref, structuredClone(e.values.get(key)?.value)] as [string, unknown],
            ),
          ),
        };
      };

      inputField.addEventListener("focus", begin);
      valueField.addEventListener("input-begin", begin);

      const update = () => {
        if (!state) return;
        const previousValues = state.values;
        state = undefined;

        for (const entity of entities) {
          const val = entity.values.get(key);
          if (!val) continue;
          const previous = previousValues.get(entity.ref);
          if (JSON.stringify(val.value) === JSON.stringify(previous)) continue;

          UndoRedoManager._.push({
            t: "modify-entity-value",
            entityRef: entity.ref,
            key,
            value: val.value,
            previous,
          });
        }
      };

      inputField.addEventListener("blur", update);
      valueField.addEventListener("input-finalize", update);

      const label = allSameValue ? key : `${key} (mixed)`;
      valuesTable.addEntry(`value:${key}`, label, firstValue.description, valueField);

      for (const entity of entities) {
        const val = entity.values.get(key);
        if (val) {
          val.onChanged(refreshValue);
          this.entityPropertyTeardown.push(() => val.removeChangeListener(refreshValue));
        }
      }
    }

    const updateHiddenStates = () => {
      let hiddenCount = 0;
      for (const [id, element] of valuesTable.entries) {
        if (!id.startsWith("value:")) continue;
        const key = id.replace("value:", "");
        const v = firstEntity.values.get(key);
        if (!v) continue;

        const hidden = typeof v.hidden === "boolean" ? v.hidden : v.hidden(firstEntity.values);
        if (hidden) element.dataset.hidden = "";
        else delete element.dataset.hidden;

        if (hidden) hiddenCount += 1;
      }

      if (hiddenCount === commonValueKeys.length) valuesSection.dataset.hidden = "";
      else delete valuesSection.dataset.hidden;
    };

    for (const entity of entities) {
      entity.values.forEach(value => value.onChanged(updateHiddenStates));
      this.entityPropertyTeardown.push(() => {
        entity.values.forEach(value => value.removeChangeListener(updateHiddenStates));
      });
    }
    updateHiddenStates();
  }
}
