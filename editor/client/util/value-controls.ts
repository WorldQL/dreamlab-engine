import {
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
import { z } from "@dreamlab/vendor/zod.ts";
import "npm:vanilla-colorful/hex-alpha-color-picker.js";
import { icon, X } from "../_icons.tsx";
import { createBooleanField, createInputFieldWithDefault } from "./easy-input.ts";

interface ValueControlOptions<T> {
  id?: string;
  typeTag?: ValueTypeTag<T>;
  default?: T;
  get: () => T;
  set: (value: T | undefined) => void;
  relatedEntity: Entity;
}

const NumericSchema = z
  .number({ coerce: true })
  .refine(Number.isFinite, "Value must be finite!");

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

    control.addEventListener("input", () => _opts.set(control.value));

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

      const container = elem("div", { className: "texture-control" });
      const imgPreview = elem("img", { className: "texture-preview hidden" });
      const noTextureClass = "no-texture";

      const updateImagePreview = async (url: string) => {
        if (!url) {
          imgPreview.classList.add("hidden");
          container.classList.add(noTextureClass);
          imgPreview.src = "";
          return;
        }

        try {
          const resolvedUrl = game.resolveResource(url);
          const texture = await PIXI.Assets.load(resolvedUrl);
          if (!(texture instanceof PIXI.Texture)) throw new TypeError("Not a texture");

          imgPreview.src = resolvedUrl;
          imgPreview.classList.remove("hidden");
          container.classList.remove(noTextureClass);
        } catch {
          imgPreview.classList.add("hidden");
          container.classList.add(noTextureClass);
          imgPreview.src = "";
        }
      };

      const [control, refreshInput] = createInputFieldWithDefault({
        default: opts.default,
        title:
          "Drag & drop an asset here, or enter a valid resource path (e.g., res://image.png)",
        get: opts.get,
        set: async v => {
          opts.set(v ?? "");
          await updateImagePreview(v ?? "");
        },
        convert: async value => {
          const url = z.literal("").or(z.string().url()).parse(value);
          await updateImagePreview(url);
          return url;
        },
      });

      updateImagePreview(opts.get() ?? "");
      container.append(imgPreview, control);

      const getUrl = (): string | undefined => {
        const dragTarget = document.querySelector(
          "[data-file][data-dragging]",
        ) as HTMLElement | null;
        if (!dragTarget) return;

        const file = `res://${dragTarget.dataset.file}`;
        return file;
      };

      container.addEventListener("dragover", ev => {
        const url = getUrl();
        if (url !== undefined) ev.preventDefault();
      });

      container.addEventListener("drop", async () => {
        const url = getUrl();
        if (url) {
          opts.set(url);
          await updateImagePreview(url);
        }
      });

      const refresh = () => {
        refreshInput();
        updateImagePreview(opts.get() ?? "");
      };

      return [container, refresh];
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
          const url = z.literal("").or(z.string().url()).parse(value);
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
        const url = z.literal("").or(z.string().url()).parse(value);
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
        const url = await getUrl();
        if (url) opts.set(url);
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
      inputContainer.append(hashLabel, input);

      const header = elem("div", { className: "color-picker-header" }, [
        elem("span", { className: "color-picker-title" }, ["Color Picker"]),
        elem("button", { className: "color-picker-close" }, [icon(X)]),
      ]);

      const picker = elem("hex-alpha-color-picker");
      picker.style.width = "150px";
      picker.style.height = "150px";

      const popup = elem("div", { className: "color-picker-popup" }, [header, picker]);

      const container = elem("div", { className: "color-picker-container" }, [
        colorBox,
        inputContainer,
        popup,
      ]);

      colorBox.addEventListener("click", e => {
        const tr = colorBox.closest("tr");
        if (!tr) return; // should always exist

        if (popup.style.display === "block") {
          popup.style.display = "none";
        } else {
          const rect = tr.getBoundingClientRect();
          popup.style.top = rect.bottom - 30 + "px";
          popup.style.left = rect.left - 175 + "px";
          popup.style.display = "block";
        }
        e.stopPropagation();
      });

      document.addEventListener("pointerdown", e => {
        if (!popup.contains(e.target as Node) && e.target !== colorBox) {
          popup.style.display = "none";
        }
      });

      const closeButton = header.querySelector(".color-picker-close") as HTMLButtonElement;
      closeButton.addEventListener("click", e => {
        popup.style.display = "none";
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
        const entity = getEntity();
        if (entity !== null) setEntity(entity);
      });

      clear.addEventListener("click", () => {
        setEntity(undefined);
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
