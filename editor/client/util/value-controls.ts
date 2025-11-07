import {
  AspectRatioAdapter,
  AudioAdapter,
  calculateRelativeEntitySelector,
  ClientGame,
  ColorAdapter,
  Entity,
  EntityByRefAdapter,
  EntityRenamed,
  EnumAdapter,
  RelativeEntity,
  resolveEntityFromRelativeSelector,
  SpritesheetAdapter,
  TextureAdapter,
  ValueTypeTag,
  Vector2,
  Vector2Adapter,
} from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import * as z from "@dreamlab/vendor/zod.ts";
import "npm:vanilla-colorful/hex-alpha-color-picker.js";
import { icon, Pipette, X } from "../_icons.tsx";
import { IconButton } from "../components/icon-button.ts";
import { createBooleanField, createInputFieldWithDefault } from "./easy-input.ts";
import { createTextureControl } from "./texture-control.ts";

interface ValueControlOptions<T> {
  id?: string;
  typeTag?: ValueTypeTag<T>;
  default?: T;
  get: () => T;
  set: (value: T | undefined) => void;
  relatedEntity: Entity;
}

const NumericSchema = z.coerce.number().refine(Number.isFinite, "Value must be finite!");

export function createValueControl(
  game: ClientGame,
  _opts: ValueControlOptions<unknown>,
): [control: HTMLElement, refresh: () => void] {
  // @ts-expect-error: ugly TS hack to check enum adapter
  if (_opts.typeTag?.prototype instanceof EnumAdapter) {
    // @ts-expect-error: ugly TS hack to force instantiate and get enum out of the type tag
    const adapter = new _opts.typeTag(game) as EnumAdapter<string[]>;
    const control = elem(
      "select",
      {},
      adapter.values.map(value => elem("option", { value }, [value])),
    );

    control.addEventListener("input", () => {
      control.dispatchEvent(new CustomEvent("input-begin"));
      _opts.set(control.value);
      control.dispatchEvent(new CustomEvent("input-finalize"));
    });

    const refresh = () => {
      const val = _opts.get() ?? _opts.default;
      if (typeof val !== "string") throw new TypeError("enum value was not a string");

      control.value = val;
    };

    refresh();
    return [control, refresh];
  }

  switch (_opts.typeTag) {
    case String: {
      const opts = _opts as ValueControlOptions<string | undefined>;
      const [control, refresh] = createInputFieldWithDefault({
        default: opts.default,
        get: opts.get,
        set: opts.set,
        convert: x => x,
        convertBack: x => x,
      });
      return [control, refresh];
    }
    case Number: {
      const opts = _opts as ValueControlOptions<number | undefined>;
      const [control, refresh] = createInputFieldWithDefault({
        default: opts.default,
        get: opts.get,
        set: opts.set,
        convert: NumericSchema.parse,
        convertBack: String,
      });
      return [control, refresh];
    }
    case Boolean: {
      const opts = _opts as ValueControlOptions<boolean | undefined>;
      const [control, refresh] = createBooleanField({
        id: opts.id,
        default: opts.default ?? false,
        get: opts.get,
        set: opts.set,
      });
      return [control, refresh];
    }

    case TextureAdapter: {
      const opts = _opts as ValueControlOptions<string | undefined>;
      return createTextureControl(game, {
        default: opts.default,
        get: opts.get,
        set: opts.set,
      });
    }

    case SpritesheetAdapter: {
      const resolve = async (url: string) => {
        try {
          const spritesheet = await PIXI.Assets.load(game.resolveResource(url));
          if (!(spritesheet instanceof PIXI.Spritesheet)) {
            throw new TypeError("not a spritesheet");
          }

          return url;
        } catch {
          throw new TypeError("Spritesheet URL could not be resolved");
        }
      };

      const getUrl = async (): Promise<string | undefined> => {
        const dragTarget = document.querySelector(
          "[data-file][data-dragging]",
        ) as HTMLElement | null;
        if (!dragTarget) return;

        const url = `res://${dragTarget.dataset.file}`;
        try {
          return await resolve(url);
        } catch {
          return undefined;
        }
      };

      const opts = _opts as ValueControlOptions<string | undefined>;
      const [control, refresh] = createInputFieldWithDefault({
        default: opts.default,
        get: opts.get,
        set: v => {
          opts.set(v ?? "");
        },
        convert: async value => {
          const url = z.literal("").or(z.url()).parse(value);
          return await resolve(url);
        },
        convertBack: x => x,
      });

      control.addEventListener("dragover", async ev => {
        const url = await getUrl();
        if (url !== undefined) ev.preventDefault();
      });

      control.addEventListener("drop", async () => {
        const url = await getUrl();
        if (url) opts.set(url);
      });

      return [control, refresh];
    }

    case AudioAdapter: {
      const opts = _opts as ValueControlOptions<string | undefined>;

      const convert = async (value: string) => {
        const url = z.literal("").or(z.url()).parse(value);
        if (url === "") return url;

        try {
          const loaded = await PIXI.Assets.load(game.resolveResource(url));
          if (typeof loaded !== "string") throw new Error(); // custom pixi loader returns strings
          return url;
        } catch {
          throw new TypeError("Audio URL could not be resolved");
        }
      };

      const [control, refresh] = createInputFieldWithDefault({
        default: opts.default,
        get: opts.get,
        set: opts.set,
        convert,
      });

      const getUrl = async (): Promise<string | undefined> => {
        const dragTarget = document.querySelector(
          "[data-file][data-dragging]",
        ) as HTMLElement | null;
        if (!dragTarget) return;

        const file = `res://${dragTarget.dataset.file}`;
        try {
          const url = await convert(file);
          return url;
        } catch {
          return undefined;
        }
      };

      control.addEventListener("dragover", async ev => {
        const url = await getUrl();
        if (url !== undefined) ev.preventDefault();
      });

      control.addEventListener("drop", async () => {
        control.dispatchEvent(new CustomEvent("input-begin"));
        const url = await getUrl();
        if (url) opts.set(url);
        control.dispatchEvent(new CustomEvent("input-finalize"));
      });

      return [control, refresh];
    }

    case Vector2Adapter: {
      const opts = _opts as ValueControlOptions<Vector2 | undefined>;

      const [xControl, refreshX] = createInputFieldWithDefault({
        default: opts.default?.x,
        get: () => opts.get()?.x,
        set: x => {
          const vec = new Vector2(opts.get() || opts.default || Vector2.ZERO);
          if (x !== undefined) vec.x = x;
          opts.set(vec);
        },
        convert: NumericSchema.parse,
      });
      const [yControl, refreshY] = createInputFieldWithDefault({
        default: opts.default?.y,
        get: () => opts.get()?.y,
        set: y => {
          const vec = new Vector2(opts.get() || opts.default || Vector2.ZERO);
          if (y !== undefined) vec.y = y;
          opts.set(vec);
        },
        convert: NumericSchema.parse,
      });

      // TODO: better layout (label x and y?)
      const control = elem("div", { className: "vector2-inputs" }, [
        elem("label", {}, ["X:"]),
        xControl,
        elem("label", {}, ["Y:"]),
        yControl,
      ]);

      const refresh = () => {
        refreshX();
        refreshY();
      };

      [xControl, yControl].forEach(c => {
        c.addEventListener("focus", () =>
          control.dispatchEvent(new CustomEvent("input-begin")),
        );
        c.addEventListener("blur", () =>
          control.dispatchEvent(new CustomEvent("input-finalize")),
        );
      });

      return [control, refresh];
    }

    case ColorAdapter: {
      const opts = _opts as ValueControlOptions<string | undefined>;

      const colorBox = elem("div", { className: "color-box" });
      const inputContainer = elem("div", { className: "color-input-container" });
      const hashLabel = elem("span", { className: "color-hash-label" }, ["#"]);
      const input = elem("input", {
        type: "text",
        className: "color-input",
        placeholder: "e.g., FF0000",
      });

      const eyedropperButton = new IconButton(Pipette, {
        className: "eyedropper-button",
        title: "Pick color from screen",
      });

      const windowWithEyeDropper = window as typeof window & {
        EyeDropper?: {
          new (): {
            open(): Promise<{ sRGBHex: string }>;
          };
        };
      };

      if (windowWithEyeDropper.EyeDropper !== undefined) {
        inputContainer.append(hashLabel, input, eyedropperButton);
      } else {
        inputContainer.append(hashLabel, input);
      }

      const header = elem("div", { className: "color-picker-header" }, [
        elem("span", { className: "color-picker-title" }, ["Color Picker"]),
        elem("button", { className: "color-picker-close" }, [icon(X)]),
      ]);

      const picker = elem("hex-alpha-color-picker");
      picker.style.width = "150px";
      picker.style.height = "150px";

      const popup = elem("div", { className: "color-picker-popup" }, [header, picker]);
      popup.style.position = "fixed";
      popup.style.zIndex = "1000";
      popup.style.display = "none";

      const container = elem("div", { className: "color-picker-container" }, [
        colorBox,
        inputContainer,
        popup,
      ]);

      // fire an input blur event on popup close so that the Undo/Redo listeners catch the action
      const openPopup = () => {
        popup.style.visibility = "";
        popup.style.display = "block";
        container.dispatchEvent(new CustomEvent("input-begin"));
      };

      const closePopup = () => {
        popup.style.display = "none";
        container.dispatchEvent(new CustomEvent("input-finalize"));
      };

      colorBox.addEventListener("click", e => {
        const tr = colorBox.closest("tr");
        if (!tr) return;

        if (popup.style.display === "block") {
          closePopup();
          return;
        }

        popup.style.visibility = "hidden";
        popup.style.display = "block";

        const popupRect = popup.getBoundingClientRect();
        const popupH = popupRect.height;

        const rowRect = tr.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rowRect.bottom;
        const spaceAbove = rowRect.top;

        let finalTop: number;
        if (spaceBelow < popupH && spaceAbove >= popupH) {
          finalTop = rowRect.top - popupH - 4;
        } else if (spaceBelow < popupH && spaceAbove < popupH) {
          finalTop = Math.max(10, window.innerHeight - popupH - 10);
        } else {
          finalTop = rowRect.bottom - 30;
        }

        const finalLeft = rowRect.left - 175;

        popup.style.top = finalTop + "px";
        popup.style.left = finalLeft + "px";
        openPopup();

        e.stopPropagation();
      });

      document.addEventListener("pointerdown", e => {
        if (!popup.contains(e.target as Node) && e.target !== colorBox) {
          closePopup();
        }
      });

      const closeButton = header.querySelector(".color-picker-close") as HTMLButtonElement;
      closeButton.addEventListener("click", e => {
        closePopup();
        e.stopPropagation();
      });

      picker.addEventListener("color-changed", () => {
        const color = picker.color;
        opts.set(color);
        input.value = color.slice(1);
        colorBox.style.backgroundColor = color;
      });

      input.addEventListener("input", () => {
        const value = input.value;
        const fullValue = "#" + value;

        if (/^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)) {
          picker.color = fullValue;
          opts.set(fullValue);
          colorBox.style.backgroundColor = fullValue;
          input.classList.remove("invalid");
        } else {
          input.classList.add("invalid");
        }
      });

      if (windowWithEyeDropper.EyeDropper !== undefined) {
        eyedropperButton.addEventListener("click", async e => {
          e.stopPropagation();

          try {
            const eyeDropper = new windowWithEyeDropper.EyeDropper!();
            const result = await eyeDropper.open();

            const hexColor = result.sRGBHex;
            picker.color = hexColor;
            opts.set(hexColor);
            input.value = hexColor.slice(1);
            colorBox.style.backgroundColor = hexColor;
          } catch (error) {
            console.log("Eyedropper was cancelled or failed:", error);
          }
        });
      }

      const refresh = () => {
        const colorValue = opts.get() ?? opts.default ?? "#ffffffff";
        const color = new PIXI.Color(colorValue);
        const hexa = color.toHexa();
        picker.color = hexa;
        colorBox.style.backgroundColor = hexa;
        if (document.activeElement !== input) {
          input.value = hexa.slice(1);
        }
      };

      refresh();
      return [container, refresh];
    }

    case RelativeEntity:
    case EntityByRefAdapter: {
      const valueDisplay = elem("code", {}, []);
      const clear = elem("button", { type: "button" }, [icon(X)]);
      const spacer = elem("div", { className: "spacer" });
      const control = elem("div", { className: "entity-inputs" }, [
        valueDisplay,
        spacer,
        clear,
      ]);

      const getEntity = (): Entity | null | undefined => {
        const dragTarget = document.querySelector(
          "[data-entity][data-dragging]",
        ) as HTMLElement | null;
        if (!dragTarget) return;

        if (!dragTarget.dataset.entity) return undefined;
        return game.entities.lookupByRef(dragTarget.dataset.entity);
      };

      control.addEventListener("dragover", ev => {
        const entity = getEntity();
        if (entity !== null) ev.preventDefault();
      });

      control.addEventListener("drop", () => {
        control.dispatchEvent(new CustomEvent("input-begin"));
        const entity = getEntity();
        if (entity !== null) setEntity(entity);
        control.dispatchEvent(new CustomEvent("input-finalize"));
      });

      clear.addEventListener("click", () => {
        control.dispatchEvent(new CustomEvent("input-begin"));
        setEntity(undefined);
        control.dispatchEvent(new CustomEvent("input-finalize"));
        refresh();
      });

      const setEntity = (entity: Entity | undefined) => {
        if (entity === undefined) {
          _opts.set(undefined);
          return;
        }

        if (_opts.typeTag === EntityByRefAdapter) {
          const opts = _opts as ValueControlOptions<string | undefined>;
          opts.set(entity.ref);
        } else if (_opts.typeTag === RelativeEntity) {
          const opts = _opts as ValueControlOptions<(string | null)[] | undefined>;
          const selector = calculateRelativeEntitySelector(_opts.relatedEntity, entity);

          opts.set(selector);
        }
      };

      let unsubscribe: (() => void) | undefined;
      const refresh = () => {
        unsubscribe?.();
        unsubscribe = undefined;

        let entity: Entity | undefined;
        if (_opts.typeTag === EntityByRefAdapter) {
          const opts = _opts as ValueControlOptions<string | undefined>;
          const value = opts.get();
          entity = value ? game.entities.lookupByRef(value) : undefined;
        } else if (_opts.typeTag === RelativeEntity) {
          const opts = _opts as ValueControlOptions<(string | null)[] | undefined>;
          const selector = opts.get();
          if (selector !== undefined) {
            entity = resolveEntityFromRelativeSelector(_opts.relatedEntity, selector);
          }
        }

        if (entity) {
          const sub = entity.on(EntityRenamed, () => {
            refresh();
          });

          unsubscribe = sub.unsubscribe;
        }

        valueDisplay.style.opacity = entity === undefined ? "0.65" : "";
        const id = entity?.id.replace("world/EditEntities/", "") ?? "[No Entity Selected]";

        valueDisplay.title = id;
        valueDisplay.textContent = id;

        if (entity === undefined) clear.classList.add("hidden");
        else clear.classList.remove("hidden");
      };

      refresh();
      return [control, refresh];
    }

    case AspectRatioAdapter: {
      const opts = _opts as ValueControlOptions<[number, number] | undefined>;

      const [wControl, refreshW] = createInputFieldWithDefault({
        default: opts.default?.[0],
        get: () => opts.get()?.[0],
        set: w => {
          const r = opts.get() || opts.default || [1, 1];
          if (w !== undefined) r[0] = w;
          opts.set([...r]);
        },
        convert: NumericSchema.parse,
      });
      const [hControl, refreshH] = createInputFieldWithDefault({
        default: opts.default?.[1],
        get: () => opts.get()?.[1],
        set: h => {
          const r = opts.get() || opts.default || [1, 1];
          if (h !== undefined) r[1] = h;
          opts.set([...r]);
        },
        convert: NumericSchema.parse,
      });

      // TODO: better layout (label x and y?)
      const control = elem("div", { className: "vector2-inputs" }, [
        elem("label", {}, ["W:"]),
        wControl,
        elem("label", {}, ["H:"]),
        hControl,
      ]);
      const refresh = () => {
        refreshW();
        refreshH();
      };

      [wControl, hControl].forEach(c => {
        c.addEventListener("focus", () =>
          control.dispatchEvent(new CustomEvent("input-begin")),
        );
        c.addEventListener("blur", () =>
          control.dispatchEvent(new CustomEvent("input-finalize")),
        );
      });

      return [control, refresh];
    }

    default: {
      let value = _opts.get();
      const valueDisplay = elem("span", {}, [String(value)]);
      const display = elem("code", {}, ["Unknown: ", valueDisplay]);
      const refresh = () => {
        value = _opts.get();
        valueDisplay.textContent = String(value);
      };
      return [display, refresh];
    }
  }
}
