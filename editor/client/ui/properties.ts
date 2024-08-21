import {
  ClientGame,
  Entity,
  EntityRenamed,
  EntityReparented,
  EntityTransformUpdate,
  SpritesheetAdapter,
  TextureAdapter,
  Value,
  ValueChanged,
} from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { z } from "@dreamlab/vendor/zod.ts";
import { DataDetails, DataTable } from "../components/mod.ts";
import { createInputField } from "../util/easy-input.ts";
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
    right.append(this.#section);
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

    const [nameField, refreshName] = createInputField({
      get: () => entity.name,
      set: name => (entity.name = name),
      convert: z.string().min(1).parse,
    });
    entity.on(EntityRenamed, refreshName);

    table.addEntry("name", "Name", nameField);

    const entityId = () => entity.id.replace("game.world._.EditEntities._.", "game.");
    const idField = elem("code", {}, [entityId()]);
    entity.on(EntityRenamed, () => (idField.textContent = entityId()));
    entity.on(EntityReparented, () => (idField.textContent = entityId()));
    table.addEntry("id", "ID", idField);

    // TODO: transform editing

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

    const [transformYField, refreshY] = createInputField({
      get: () => entity.transform.position.y,
      set: y => (entity.transform.position.y = y),
      convert: numeric.parse,
      convertBack: n => n.toFixed(4),
    });
    txfmTable.addEntry("posY", "Position Y", transformYField);

    const [transformRotation, refreshRotation] = createInputField({
      get: () => entity.transform.rotation,
      set: r => (entity.transform.rotation = r),
      convert: numeric.transform(v => (v * Math.PI) / 180).parse,
      convertBack: v => ((v * 180) / Math.PI).toFixed(1),
    });
    txfmTable.addEntry("rot", "Rotation", transformRotation);

    const [scaleXField, refreshScaleX] = createInputField({
      get: () => entity.transform.scale.x,
      set: x => (entity.transform.scale.x = x),
      convert: numeric.parse,
      convertBack: n => n.toFixed(4),
    });
    txfmTable.addEntry("scaleX", "Scale X", scaleXField);

    const [scaleYField, refreshScaleY] = createInputField({
      get: () => entity.transform.scale.y,
      set: y => (entity.transform.scale.y = y),
      convert: numeric.parse,
      convertBack: n => n.toFixed(4),
    });
    txfmTable.addEntry("scaleY", "Scale Y", scaleYField);

    const [zIndexField, refreshZIndex] = createInputField({
      get: () => entity.transform.z,
      set: z => (entity.transform.z = z),
      convert: numeric.refine(Number.isSafeInteger, "Number must be an integer!").parse,
      convertBack: n => n.toFixed(0),
    });
    txfmTable.addEntry("z", "Z Index", zIndexField);

    entity.on(EntityTransformUpdate, () => {
      refreshX();
      refreshY();
      refreshRotation();
      refreshScaleX();
      refreshScaleY();
      refreshZIndex();
    });

    if (entity.values.size === 0) return;

    const valuesSection = new DataDetails();
    container.append(valuesSection);
    valuesSection.setHeaderContent(elem("h2", {}, ["Values"]));

    const valuesTable = new DataTable();
    valuesSection.addContent(valuesTable);

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

        const convert = async (value: string) => {
          const url = z.literal("").or(z.string().url()).parse(value);
          if (url === "") return url;

          try {
            const texture = await PIXI.Assets.load(this.game.resolveResource(url));
            if (!(texture instanceof PIXI.Texture)) throw new TypeError("not a texture");

            return url;
          } catch {
            throw new Error("Texture URL could not be resolved");
          }
        };

        const valueObj = value as Value<string>;
        [valueField, refreshValue] = createInputField({
          get: () => valueObj.value,
          set: v => (valueObj.value = v),
          convert,

          hook: input => {
            // TODO: add event listeners on parent so we get more leeway with the drop zone
            // we cant do input.parentElement now because the input hasnt been appended yet

            input.addEventListener("dragover", ev => {
              ev.preventDefault();
            });

            input.addEventListener("drop", async () => {
              const dragTarget = document.querySelector(
                "[data-file][data-dragging]",
              ) as HTMLElement | null;
              if (!dragTarget) return;

              const file = `res://${dragTarget.dataset.file}`;

              try {
                const url = await convert(file);
                valueObj.value = url;
              } catch {
                // Ignore
              }
            });
          },
        });
      } else if (value.typeTag === SpritesheetAdapter) {
        // TODO: spritesheet picker
        const valueObj = value as Value<string>;
        [valueField, refreshValue] = createInputField({
          get: () => valueObj.value,
          set: v => (valueObj.value = v),
          convert: async value => {
            const url = z.literal("").or(z.string().url()).parse(value);
            try {
              const spritesheet = await PIXI.Assets.load(this.game.resolveResource(url));
              if (!(spritesheet instanceof PIXI.Spritesheet)) {
                throw new TypeError("not a spritesheet");
              }

              return url;
            } catch {
              throw new TypeError("Spritesheet URL could not be resolved");
            }
          },
        });
      }
      // TODO: other adapters

      if (valueField && refreshValue) {
        valuesTable.addEntry(`value:${key}`, key, valueField);
        this.game.values.on(ValueChanged, event => {
          if (event.value === value) refreshValue();
        });
      }
    }
  }
}
