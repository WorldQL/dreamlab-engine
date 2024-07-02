import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { EntityDestroyed, GameRender, EntityUpdate } from "../../signals/mod.ts";
import { Entity, EntityContext } from "../entity.ts";
import { InterpolatedEntity } from "../interpolated-entity.ts";
import { Sprite2D } from "./mod.ts";
import { TextureArrayAdapter } from "../../value/adapters/texture-adapter.ts";

export class AnimatedSprite2D extends InterpolatedEntity {
  public static readonly icon = "🎨";

  width: number = 1;
  height: number = 1;
  textures: string[] | string = Sprite2D.WHITE_PNG;
  alpha: number = 1;
  animationSpeed: number = 1;
  loop: boolean = true;

  #sprite: PIXI.AnimatedSprite | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(AnimatedSprite2D, "width", "height", "alpha", "animationSpeed", "loop");
    this.value(AnimatedSprite2D, "textures", {
      type: TextureArrayAdapter,
      description: "Array of texture URLs or a spritesheet URL",
    });

    const textureArray = Array.isArray(this.textures) ? this.textures : [this.textures];
    textureArray.forEach(texture => PIXI.Assets.backgroundLoad(texture));

    this.listen(this.game, GameRender, () => {
      if (!this.#sprite) return;

      this.#sprite.width = this.width * this.globalTransform.scale.x;
      this.#sprite.height = this.height * this.globalTransform.scale.y;

      const pos = this.interpolated.position;
      this.#sprite.position = { x: pos.x, y: -pos.y };
      this.#sprite.rotation = -this.interpolated.rotation;
      this.#sprite.alpha = this.alpha;
      this.#sprite.animationSpeed = this.animationSpeed;
      this.#sprite.loop = this.loop;
    });

    this.on(EntityDestroyed, () => {
      this.#sprite?.destroy();
    });

    this.listenForUpdates();
  }

  async onInitialize() {
    if (!this.game.isClient()) return;

    await this.loadTextures();
  }

  private async loadTextures() {
    if (!this.game.isClient()) return;

    let textures: PIXI.Texture[];
    const textureArray = Array.isArray(this.textures) ? this.textures : [this.textures];

    if (textureArray.length === 1 && textureArray[0].endsWith(".json")) {
      const spritesheet = (await PIXI.Assets.load(textureArray[0])) as PIXI.Spritesheet;
      textures = Object.values(spritesheet.textures);
    } else {
      textures = (await Promise.all(
        textureArray.map(texture => PIXI.Assets.load(texture)),
      )) as PIXI.Texture[];
    }

    if (!this.#sprite) {
      this.#sprite = new PIXI.AnimatedSprite(textures);
      this.#sprite.width = this.width * this.globalTransform.scale.x;
      this.#sprite.height = this.height * this.globalTransform.scale.y;
      this.#sprite.position = {
        x: this.globalTransform.position.x,
        y: -this.globalTransform.position.y,
      };
      this.#sprite.rotation = this.globalTransform.rotation;
      this.#sprite.anchor.set(0.5);
      this.#sprite.animationSpeed = this.animationSpeed;
      this.#sprite.loop = this.loop;
      this.#sprite.play();
      this.game.renderer.scene.addChild(this.#sprite);
    } else {
      this.#sprite.textures = textures;
      this.#sprite.play();
    }
  }

  private listenForUpdates() {
    let previousTextures = Array.isArray(this.textures) ? [...this.textures] : [this.textures];
    this.on(EntityUpdate, async () => {
      const currentTextures = Array.isArray(this.textures) ? this.textures : [this.textures];
      if (JSON.stringify(currentTextures) !== JSON.stringify(previousTextures)) {
        previousTextures = [...currentTextures];
        await this.loadTextures();
      }
    });
  }
}

Entity.registerType(AnimatedSprite2D, "@core");
