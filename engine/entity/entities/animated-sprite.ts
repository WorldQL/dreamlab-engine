import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { IVector2, Vector2 } from "../../math/mod.ts";
import { EntityTransformUpdate, GameRender } from "../../signals/mod.ts";
import { SpritesheetAdapter } from "../../value/adapters/texture-adapter.ts";
import { Entity, EntityContext } from "../entity.ts";
import { PixiEntity } from "../pixi-entity.ts";
import { AbstractRenderer } from "@dreamlab/vendor/pixi.ts";
import { EntityEnableChanged, ObjectAdapter, TextureAdapter } from "@dreamlab/engine";

// this shockingly fixes spritesheet bleeding
AbstractRenderer.defaultOptions.roundPixels = true;

export class AnimatedSprite extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "🖼️";
  get bounds(): Readonly<IVector2> | undefined {
    // TODO: Reuse the same vector
    return new Vector2(this.width, this.height);
  }

  width: number = 1;
  height: number = 1;
  spritesheetJSON: string = "";
  alpha: number = 1;
  speed: number = 0.1;
  loop: boolean = true;
  startFrame: number = 0;
  endFrame: number = -1;

  texture: string = "";
  frameWidth: number = 0;
  frameHeight: number = 0;
  cachedAtlas = '{"stringifiedJson": "we can hide this"}';

  #sprite: PIXI.AnimatedSprite | undefined;
  get sprite(): PIXI.AnimatedSprite | undefined {
    return this.#sprite;
  }

  #originalTextures: PIXI.Texture[] | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(
      AnimatedSprite,
      "width",
      "height",
      "alpha",
      "speed",
      "loop",
      "startFrame",
      "endFrame",
    );
    this.defineValue(AnimatedSprite, "spritesheetJSON", { type: SpritesheetAdapter });
    this.defineValue(AnimatedSprite, "texture", { type: TextureAdapter });
    this.defineValues(AnimatedSprite, "frameWidth", "frameHeight");
    this.defineValue(AnimatedSprite, "cachedAtlas");

    if (this.game.isClient() && this.spritesheetJSON !== "") {
      // PIXI.Assets.backgroundLoad(this.game.resolveResource(this.spritesheet));
    }

    const updateSize = () => {
      if (!this.#sprite) return;
      this.#sprite.scale.set(0);
      this.#sprite.width = this.width * this.globalTransform.scale.x;
      this.#sprite.height = this.height * this.globalTransform.scale.y;
    };

    this.on(EntityTransformUpdate, updateSize);
    this.listen(this.game, GameRender, () => {
      if (!this.#sprite || !this.game.isClient()) return;
      if (this.enabled && !this.game.paused.value) {
        this.#sprite.update(this.game.renderer.app.ticker);
      }
      updateSize();
    });

    const widthValue = this.values.get("width");
    const heightValue = this.values.get("height");
    widthValue?.onChanged(updateSize);
    heightValue?.onChanged(updateSize);

    const spritesheetValue = this.values.get("spritesheet");
    spritesheetValue?.onChanged(() => {
      void this.#getTextures().then(() => {
        this.#updateTextures();
      });
    });

    const alphaValue = this.values.get("alpha");
    alphaValue?.onChanged(() => {
      if (!this.#sprite) return;
      this.#sprite.alpha = this.alpha;
    });

    this.values.get("speed")?.onChanged(() => {
      if (!this.#sprite) return;
      this.#sprite.animationSpeed = this.speed;
    });

    this.values.get("loop")?.onChanged(() => {
      if (!this.#sprite) return;
      this.#sprite.loop = this.loop;
      this.#sprite.gotoAndPlay(0);
    });

    this.on(EntityEnableChanged, () => {
      this.#sprite?.gotoAndPlay(0);
    });

    const startFrameValue = this.values.get("startFrame");
    const endFrameValue = this.values.get("endFrame");
    startFrameValue?.onChanged(this.#updateTextures.bind(this));
    endFrameValue?.onChanged(this.#updateTextures.bind(this));
  }

  async #getTextures(): Promise<void> {
    if (this.spritesheet === "") {
      this.#originalTextures = [PIXI.Texture.WHITE];
      return;
    }

    const spritesheet = await PIXI.Assets.load(this.game.resolveResource(this.spritesheet));
    if (!(spritesheet instanceof PIXI.Spritesheet)) {
      throw new TypeError("texture is not a pixi spritesheet");
    }
    spritesheet.textureSource.scaleMode = "nearest";

    this.#originalTextures = Object.values(spritesheet.textures);
  }

  #getCurrentTextures(): PIXI.Texture[] {
    if (!this.#originalTextures) return [PIXI.Texture.WHITE];
    const totalFrames = this.#originalTextures.length;
    const start = Math.max(0, Math.min(this.startFrame, totalFrames - 1));
    let end = Math.max(start, Math.min(this.endFrame, totalFrames - 1));
    if (this.endFrame === -1) {
      end = totalFrames - 1;
    }
    return this.#originalTextures.slice(start, end + 1);
  }

  #updateTextures() {
    if (!this.#sprite || !this.#originalTextures) return;
    this.#sprite.textures = this.#getCurrentTextures();
    this.#sprite.play();
  }

  async onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    await this.#getTextures();
    if (!this.#originalTextures) return;

    this.#sprite = new PIXI.AnimatedSprite({
      autoUpdate: false,
      textures: this.#getCurrentTextures(),
      width: this.width * this.globalTransform.scale.x,
      height: this.height * this.globalTransform.scale.y,
      anchor: 0.5,
      alpha: this.alpha,
    });
    this.#sprite.animationSpeed = this.speed;
    this.#sprite.loop = this.loop;
    this.#sprite.play();

    this.container.addChild(this.#sprite);
  }
}
