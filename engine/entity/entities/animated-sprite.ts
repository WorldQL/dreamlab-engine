import {
  Bounds,
  Camera,
  CameraFilterModeChanged,
  ColorAdapter,
  Entity,
  EntityContext,
  EntityEnableChanged,
  EntityTransformUpdate,
  GameRender,
  IBounds,
  PixiEntity,
  SpritesheetAdapter,
  SpriteTextureChanged,
  TextureAdapter,
  Vector2,
  Vector2Adapter,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

// this shockingly fixes spritesheet bleeding
PIXI.AbstractRenderer.defaultOptions.roundPixels = true;

// todo: implement this using fancy new conditional fields.
const SpriteSliceModes = ["Width and Height", "Rows and Columns"] as const;
type SpriteSliceModes = (typeof SpriteSliceModes)[number];

const texturesCache = new Map<string, PIXI.Texture[]>();

export class AnimatedSprite extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🖼️";
  get bounds(): IBounds | undefined {
    // TODO: Reuse the same object
    return new Bounds(this.width, this.height);
  }

  width: number = 1;
  height: number = 1;

  jsonSpritesheet: string = "";
  spritesheet: string = "";
  frameDimensions: Vector2 = new Vector2(128, 128);

  alpha: number = 1;
  tint: string = "white";
  speed: number = 0.1;
  loop: boolean = true;
  startFrame: number = 0;
  endFrame: number = -1;
  totalFrames: number = 0;

  #sprite: PIXI.AnimatedSprite | undefined;
  get sprite(): PIXI.AnimatedSprite | undefined {
    return this.#sprite;
  }

  async #loadTextures(): Promise<PIXI.Texture[]> {
    const camera = Camera.getActive(this.game);
    const scaleMode = camera?.scaleFilterMode ?? "nearest";

    if (this.jsonSpritesheet !== "") {
      const cached = texturesCache.get(this.jsonSpritesheet);
      if (cached) return cached;

      const resource = this.game.resolveResource(this.jsonSpritesheet);
      const spritesheet = await PIXI.Assets.load(resource);
      if (!(spritesheet instanceof PIXI.Spritesheet)) {
        throw new TypeError(`${this.id}.spritesheet is not a pixi spritesheet`);
      }

      const textures = Object.values(spritesheet.textures);
      for (const texture of textures) {
        texture.source.scaleMode = scaleMode;
        texture.source.update();
        texture.update();
      }

      texturesCache.set(this.jsonSpritesheet, textures);
      return textures;
    }

    if (
      this.spritesheet !== "" &&
      this.frameDimensions.x !== 1 &&
      this.frameDimensions.y !== 1
    ) {
      const cacheKey = `${this.spritesheet}:${this.frameDimensions.x}x${this.frameDimensions.y}`;
      const cached = texturesCache.get(cacheKey);
      if (cached) return cached;

      const resource = this.game.resolveResource(this.spritesheet);
      const _spritesheetTexture = await PIXI.Assets.load(resource);
      if (!(_spritesheetTexture instanceof PIXI.Texture)) {
        throw new TypeError(`${this.id}.spritesheet is not a pixi texture`);
      }

      const spritesheetTexture: PIXI.Texture<PIXI.TextureSource> = _spritesheetTexture;
      spritesheetTexture.source.scaleMode = scaleMode;
      spritesheetTexture.source.update();
      spritesheetTexture.update();

      const frameWidth = this.frameDimensions.x;
      const frameHeight = this.frameDimensions.y;

      const framesX = spritesheetTexture.width / frameWidth;
      const framesY = spritesheetTexture.height / frameHeight;

      const frames: PIXI.SpritesheetData["frames"] = {};
      for (let y = 0; y < framesY; y++) {
        for (let x = 0; x < framesX; x++) {
          const idx = `${x}-${y}`;
          frames[idx] = {
            frame: { w: frameWidth, h: frameHeight, x: x * frameWidth, y: y * frameHeight },
            sourceSize: { w: frameWidth, h: frameHeight },
          };
        }
      }

      const data: PIXI.SpritesheetData = {
        frames,
        meta: {
          image: resource,
          size: { w: spritesheetTexture.width, h: spritesheetTexture.height },
          scale: 1,
        },
      };

      const spritesheet = new PIXI.Spritesheet(spritesheetTexture, data);
      await spritesheet.parse();

      const textures = Object.values(spritesheet.textures);
      if (textures.length > 0) {
        texturesCache.set(cacheKey, textures);
        return textures;
      }

      console.error(`${this.id}: spritesheet config had no textures`);
    }

    return [PIXI.Texture.WHITE];
  }

  // prevents earlier texture loads from taking precedence when values are quickly changed
  #textureLoadCounter = 0;

  async #textures(): Promise<PIXI.Texture[]> {
    const currentCounter = ++this.#textureLoadCounter;
    const textures = await this.#loadTextures();
    if (currentCounter !== this.#textureLoadCounter) {
      return [];
    }
    if (textures.length === 0) throw new Error("failed to load textures");

    this.totalFrames = textures.length;
    const frames = textures.length;
    const start = Math.max(0, Math.min(this.startFrame, frames - 1));
    let end = Math.max(start, Math.min(this.endFrame, frames - 1));
    if (this.endFrame === -1) {
      end = frames - 1;
    }

    return textures.slice(start, end + 1);
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(AnimatedSprite, "spritesheet", {
      type: TextureAdapter,
      hidden: values => values.get("jsonSpritesheet")?.value !== "",
      sortOrder: 100,
      description:
        "Spritesheet image file to slice manually into frames. Can be dragged from the project panel or typed with 'res://<path>'.",
    });

    this.defineValue(AnimatedSprite, "jsonSpritesheet", {
      type: SpritesheetAdapter,
      hidden: values => values.get("spritesheet")?.value !== "",
      sortOrder: 90,
      description:
        "Predefined JSON spritesheet with frame metadata. Can be dragged from the project panel or typed with 'res://<path>'",
    });

    this.defineValue(AnimatedSprite, "frameDimensions", {
      type: Vector2Adapter,
      hidden: values => values.get("jsonSpritesheet")?.value !== "",
      sortOrder: 80,
      description: "Width and height of each frame when slicing from a raw spritesheet.",
    });

    this.defineValue(AnimatedSprite, "startFrame", {
      sortOrder: 70,
      description: "Index of the first frame to play (inclusive).",
    });

    this.defineValue(AnimatedSprite, "endFrame", {
      sortOrder: 60,
      description: "Index of the last frame to play (inclusive). Use -1 to play until the end.",
    });

    this.defineValue(AnimatedSprite, "totalFrames", {
      sortOrder: 65,
      hidden: () => true,
      description: "Total number of frames after slicing. Auto-calculated.",
    });

    this.defineValue(AnimatedSprite, "speed", {
      sortOrder: 50,
      description: "Playback speed of the animation. Higher = faster.",
    });

    this.defineValue(AnimatedSprite, "loop", {
      sortOrder: 40,
      description: "Whether the animation should loop continuously.",
    });

    this.defineValue(AnimatedSprite, "width", {
      sortOrder: 30,
      description: "Logical width of the sprite (in local units).",
    });

    this.defineValue(AnimatedSprite, "height", {
      sortOrder: 20,
      description: "Logical height of the sprite (in local units).",
    });

    this.defineValue(AnimatedSprite, "alpha", {
      sortOrder: 10,
      description: "Opacity from 0 (invisible) to 1 (fully visible).",
    });

    this.defineValue(AnimatedSprite, "tint", {
      type: ColorAdapter,
      sortOrder: 9,
      description: "Tint color applied to the sprite (e.g., white = no tint).",
    });

    // why was this disabled?
    // if (this.game.isClient() && this.spritesheet !== "") {
    //   PIXI.Assets.backgroundLoad(this.game.resolveResource(this.spritesheet));
    // }

    const updateTextures = () => {
      const sprite = this.#sprite;
      if (!sprite) return;

      void this.#textures().then(textures => {
        if (this.destroyed) return;
        if (textures.length > 0) {
          sprite.textures = textures;
          sprite.play();

          this.fire(SpriteTextureChanged, this);
          this.game.fire(SpriteTextureChanged, this);
        }
      });
    };

    const updateSize = () => {
      if (!this.#sprite) return;
      if (!this.#sprite.scale) return;
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

    const jsonSpritesheetValue = this.values.get("jsonSpritesheet");
    const spritesheetValue = this.values.get("spritesheet");
    jsonSpritesheetValue?.onChanged(updateTextures);
    spritesheetValue?.onChanged(updateTextures);

    const alphaValue = this.values.get("alpha");
    alphaValue?.onChanged(() => {
      if (!this.#sprite) return;
      this.#sprite.alpha = this.alpha;
    });

    const tintValue = this.values.get("tint");
    tintValue?.onChanged(() => {
      if (!this.#sprite) return;
      this.#sprite.tint = this.tint;
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

    this.on(EntityEnableChanged, value => {
      if (value) this.#sprite?.gotoAndPlay(0);
    });

    const startFrameValue = this.values.get("startFrame");
    const endFrameValue = this.values.get("endFrame");
    startFrameValue?.onChanged(updateTextures);
    endFrameValue?.onChanged(updateTextures);

    const frameDimensionsValue = this.values.get("frameDimensions");
    frameDimensionsValue?.onChanged(() => {
      updateTextures();
    });

    this.listen(this.game, CameraFilterModeChanged, () => {
      updateTextures();
    });
  }

  async onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    this.#sprite = new PIXI.AnimatedSprite({
      autoUpdate: false,
      textures: [PIXI.Texture.EMPTY],
      width: this.width * this.globalTransform.scale.x,
      height: this.height * this.globalTransform.scale.y,
      anchor: 0.5,
      alpha: this.alpha,
      tint: this.tint,
    });

    const textures = await this.#textures();
    if (textures.length > 0) this.#sprite.textures = textures;

    this.#sprite.animationSpeed = this.speed;
    this.#sprite.loop = this.loop;
    this.#sprite.play();

    this.container.addChild(this.#sprite);

    this.fire(SpriteTextureChanged, this);
    this.game.fire(SpriteTextureChanged, this);
  }
}
