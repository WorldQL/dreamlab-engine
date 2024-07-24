import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { IVector2, Vector2 } from "../../math/mod.ts";
import { EntityDestroyed, GameRender } from "../../signals/mod.ts";
import { SpritesheetAdapter } from "../../value/adapters/texture-adapter.ts";
import { ValueChanged } from "../../value/mod.ts";
import { Entity, EntityContext } from "../entity.ts";
import { PixiEntity } from "../pixi-entity.ts";

export class AnimatedSprite2D extends PixiEntity {
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
  spritesheet: string = "https://s3-assets.dreamlab.gg/characters/default/walk.json";
  alpha: number = 1;
  speed: number = 0.1;
  loop: boolean = true;

  sprite: PIXI.AnimatedSprite | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(AnimatedSprite2D, "width", "height", "alpha", "speed", "loop");
    this.defineValue(AnimatedSprite2D, "spritesheet", { type: SpritesheetAdapter });

    if (this.spritesheet !== "") {
      PIXI.Assets.backgroundLoad(this.spritesheet);
    }

    this.listen(this.game, GameRender, () => {
      if (!this.sprite) return;

      this.sprite.width = this.width * this.globalTransform.scale.x;
      this.sprite.height = this.height * this.globalTransform.scale.y;
      this.sprite.alpha = this.alpha;
    });

    const spritesheetValue = this.values.get("spritesheet");
    this.listen(this.game.values, ValueChanged, async event => {
      if (!this.sprite) return;
      if (event.value !== spritesheetValue) return;

      const textures = await this.#getTextures();
      this.sprite.textures = textures;
      this.sprite.play();
    });

    this.on(EntityDestroyed, () => {
      this.sprite?.destroy();
    });
  }

  async #getTextures(): Promise<PIXI.Texture[]> {
    if (this.spritesheet === "") return [PIXI.Texture.WHITE];

    const spritesheet = await PIXI.Assets.load(this.spritesheet);
    if (!(spritesheet instanceof PIXI.Spritesheet)) {
      throw new TypeError("texture is not a pixi sritesheet");
    }

    return Object.values(spritesheet.textures);
  }

  async onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    const textures = await this.#getTextures();
    this.sprite = new PIXI.AnimatedSprite(textures);

    this.sprite.width = this.width * this.globalTransform.scale.x;
    this.sprite.height = this.height * this.globalTransform.scale.y;
    this.sprite.anchor.set(0.5);
    this.sprite.alpha = this.alpha;
    this.sprite.animationSpeed = this.speed;
    this.sprite.loop = this.loop;
    this.sprite.play();

    this.container.addChild(this.sprite);
  }
}
