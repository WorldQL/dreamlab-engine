import {
  ClientGame,
  SpritesheetAdapter,
  TextureAdapter,
  ValueTypeTag,
  Vector2,
  Vector2Adapter,
} from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { z } from "@dreamlab/vendor/zod.ts";
import { createInputFieldWithDefault } from "./easy-input.ts";

interface ValueControlOptions<T> {
  typeTag?: ValueTypeTag<T>;
  default?: T;
  get: () => T;
  set: (value: T | undefined) => void;
}

const NumericSchema = z
  .number({ coerce: true })
  .refine(Number.isFinite, "Value must be finite!");
const BooleanSchema = z
  .enum(["false", "0"])
  .transform(() => false)
  .or(z.string())
  .pipe(z.coerce.boolean());

export function createValueControl(
  game: ClientGame,
  _opts: ValueControlOptions<unknown>,
): [control: HTMLElement, refresh: () => void] {
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
      // TODO: checkbox instead
      const [control, refresh] = createInputFieldWithDefault({
        default: opts.default,
        get: opts.get,
        set: opts.set,
        convert: BooleanSchema.parse,
        convertBack: String,
      });
      return [control, refresh];
    }

    case TextureAdapter: {
      const opts = _opts as ValueControlOptions<string | undefined>;

      const convert = async (value: string) => {
        const url = z.literal("").or(z.string().url()).parse(value);
        if (url === "") return url;

        try {
          const texture = await PIXI.Assets.load(game.resolveResource(url));
          if (!(texture instanceof PIXI.Texture)) throw new TypeError("not a texture");

          return url;
        } catch {
          throw new Error("Texture URL could not be resolved");
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

    case SpritesheetAdapter: {
      // TODO: spritesheet picker
      const opts = _opts as ValueControlOptions<string | undefined>;
      const [control, refresh] = createInputFieldWithDefault({
        default: opts.default,
        get: opts.get,
        set: opts.set,
        convert: async value => {
          const url = z.literal("").or(z.string().url()).parse(value);
          try {
            const spritesheet = await PIXI.Assets.load(game.resolveResource(url));
            if (!(spritesheet instanceof PIXI.Spritesheet)) {
              throw new TypeError("not a spritesheet");
            }

            return url;
          } catch {
            throw new TypeError("Spritesheet URL could not be resolved");
          }
        },
        convertBack: x => x,
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