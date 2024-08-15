import {
  ClientGame,
  Entity,
  EntityRenamed,
  EntityReparented,
  EntityTransformUpdate,
  Value,
  ValueChanged,
  TextureAdapter,
  SpritesheetAdapter,
} from "@dreamlab/engine";
import { InspectorUI, InspectorUIComponent } from "./inspector.ts";
import { element as elem } from "@dreamlab/ui";
import { z } from "@dreamlab/vendor/zod.ts";
import { createInputField } from "./easy-input.ts";

export class Properties implements InspectorUIComponent {
  constructor(private game: ClientGame) {}

  render(ui: InspectorUI, editUIRoot: HTMLElement): void {
    const right = editUIRoot.querySelector("#right-sidebar")!;
    const container = elem("section", { id: "properties" }, [elem("h1", {}, ["Properties"])]);
    right.append(container);

    const propertiesTable = elem("table");
    propertiesTable.style.display = "none";

    container.append(propertiesTable);

    const selectSomethingNotification = elem("p", { id: "select-something-notification" }, [
      "Select an entity to view its properties.",
    ]);

    container.append(selectSomethingNotification);

    ui.selectedEntity.listen(() => {
      const entity = ui.selectedEntity.entities.at(0);

      if (entity) {
        selectSomethingNotification.style.display = "none";
        propertiesTable.style.display = "table";
        this.drawEntityProperties(propertiesTable, entity);
      } else {
        propertiesTable.style.display = "none";
        selectSomethingNotification.style.display = "block";
      }
    });
  }

  drawEntityProperties(table: HTMLTableElement, entity: Entity) {
    // TODO: clean up old listeners instead of leaking them
    // i think it would be easier if .on() gave u an object that u can .unsubscribe() on

    table.querySelector("tbody")?.remove();
    const tbody = elem("tbody");
    table.append(tbody);

    function addEntry(key: string, value: Element | string | Text, body: HTMLElement = tbody) {
      body.append(elem("tr", {}, [elem("th", {}, [key]), elem("td", { colSpan: 2 }, [value])]));
    }

    const [nameField, refreshName] = createInputField({
      get: () => entity.name,
      set: name => (entity.name = name),
      convert: z.string().min(1).parse,
    });
    entity.on(EntityRenamed, refreshName);

    addEntry("Name", nameField);

    const entityId = () => entity.id.replace("game.world._.EditEntities._.", "game.");
    const idField = elem("span", {}, [entityId()]);
    entity.on(EntityRenamed, () => (idField.textContent = entityId()));
    entity.on(EntityReparented, () => (idField.textContent = entityId()));
    addEntry("ID", idField);

    // TODO: transform editing

    const txfmTbody = elem("tbody");

    const position = elem("span");
    const updatePosition = () => {
      position.textContent = `(Global: ${entity.pos.x.toFixed(2)}, ${entity.pos.y.toFixed(2)})`;
    };
    updatePosition();
    entity.on(EntityTransformUpdate, updatePosition);

    tbody.append(
      elem("tr", {}, [
        elem("td", { colSpan: 3 }, [
          elem("details", { open: true }, [
            elem("summary", {}, [elem("h2", {}, ["Transform", " ", position])]),
            elem("table", {}, [txfmTbody]),
          ]),
        ]),
      ]),
    );

    const numeric = z.number({ coerce: true }).refine(Number.isFinite, "Value must be finite!");
    const [transformXField, refreshX] = createInputField({
      get: () => entity.transform.position.x,
      set: x => (entity.transform.position.x = x),
      convert: numeric.parse,
      convertBack: n => n.toFixed(4),
    });
    addEntry("Position X", transformXField, txfmTbody);

    const [transformYField, refreshY] = createInputField({
      get: () => entity.transform.position.y,
      set: y => (entity.transform.position.y = y),
      convert: numeric.parse,
      convertBack: n => n.toFixed(4),
    });
    addEntry("Position Y", transformYField, txfmTbody);

    const [transformRotation, refreshRotation] = createInputField({
      get: () => entity.transform.rotation,
      set: r => (entity.transform.rotation = r),
      convert: numeric.transform(v => (v * Math.PI) / 180).parse,
      convertBack: v => ((v * 180) / Math.PI).toFixed(1),
    });
    addEntry("Rotation", transformRotation, txfmTbody);

    const [scaleXField, refreshScaleX] = createInputField({
      get: () => entity.transform.scale.x,
      set: x => (entity.transform.scale.x = x),
      convert: numeric.parse,
      convertBack: n => n.toFixed(4),
    });
    addEntry("Scale X", scaleXField, txfmTbody);

    const [scaleYField, refreshScaleY] = createInputField({
      get: () => entity.transform.scale.y,
      set: y => (entity.transform.scale.y = y),
      convert: numeric.parse,
      convertBack: n => n.toFixed(4),
    });
    addEntry("Scale Y", scaleYField, txfmTbody);

    const [zIndexField, refreshZIndex] = createInputField({
      get: () => entity.transform.z,
      set: z => (entity.transform.z = z),
      convert: numeric.refine(Number.isSafeInteger, "Number must be an integer!").parse,
      convertBack: n => n.toFixed(0),
    });
    addEntry("Z Index", zIndexField, txfmTbody);

    entity.on(EntityTransformUpdate, () => {
      refreshX();
      refreshY();
      refreshRotation();
      refreshScaleX();
      refreshScaleY();
      refreshZIndex();
    });

    if (entity.values.size === 0) return;

    const valuesTbody = elem("tbody");
    tbody.append(
      elem("tr", {}, [
        elem("td", { colSpan: 3 }, [
          elem("details", { open: true }, [
            elem("summary", {}, [elem("h2", {}, ["Values"])]),
            elem("table", {}, [valuesTbody]),
          ]),
        ]),
      ]),
    );

    for (const [key, value] of entity.values.entries()) {
      let valueField: HTMLInputElement | undefined;
      let refreshValue: (() => void) | undefined;

      if (value.typeTag === String) {
        const valueObj = value as Value<string>;
        [valueField, refreshValue] = createInputField({
          get: () => valueObj.value,
          set: v => (valueObj.value = v),
          convert: x => x,
        });
      } else if (value.typeTag === Number) {
        const valueObj = value as Value<number>;
        [valueField, refreshValue] = createInputField({
          get: () => valueObj.value,
          set: v => (valueObj.value = v),
          convert: numeric.parse,
        });
      } else if (value.typeTag === Boolean) {
        const valueObj = value as Value<boolean>;
        [valueField, refreshValue] = createInputField({
          get: () => valueObj.value,
          set: v => (valueObj.value = v),
          convert: z
            .enum(["false", "0"])
            .transform(() => false)
            .or(z.string())
            .pipe(z.coerce.boolean()).parse,
        });
      } else if (value.typeTag === TextureAdapter) {
        // TODO: texture picker
        const valueObj = value as Value<string>;
        [valueField, refreshValue] = createInputField({
          get: () => valueObj.value,
          set: v => (valueObj.value = v),
          convert: z.literal("").or(z.string().url()).parse,
        });
      } else if (value.typeTag === SpritesheetAdapter) {
        // TODO: spritesheet picker
        const valueObj = value as Value<string>;
        [valueField, refreshValue] = createInputField({
          get: () => valueObj.value,
          set: v => (valueObj.value = v),
          convert: z.literal("").or(z.string().url()).parse,
        });
      }
      // TODO: other adapters

      if (valueField && refreshValue) {
        addEntry(key, valueField, valuesTbody);

        this.game.values.on(ValueChanged, event => {
          if (event.value === value) refreshValue();
        });
      }
    }
  }
}
