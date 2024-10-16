import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { IVector2, Vector2 } from "../../math/mod.ts";
import { GameRender } from "../../signals/mod.ts";
import { SpritesheetAdapter } from "../../value/adapters/texture-adapter.ts";
import { Entity, EntityContext } from "../entity.ts";
import { PixiEntity } from "../pixi-entity.ts";

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
  spritesheet: string = "";
  alpha: number = 1;
  speed: number = 0.1;
  loop: boolean = true;

  #sprite: PIXI.AnimatedSprite | undefined;
  get sprite(): PIXI.AnimatedSprite | undefined {
    return this.#sprite;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValues(AnimatedSprite, "width", "height", "alpha", "speed", "loop");
    this.defineValue(AnimatedSprite, "spritesheet", { type: SpritesheetAdapter });

    if (this.game.isClient() && this.spritesheet !== "") {
      PIXI.Assets.backgroundLoad(this.game.resolveResource(this.spritesheet));
    }

    this.listen(this.game, GameRender, () => {
      if (!this.#sprite) return;

      this.#sprite.width = this.width * this.globalTransform.scale.x;
      this.#sprite.height = this.height * this.globalTransform.scale.y;
      this.#sprite.alpha = this.alpha;
    });

    const spritesheetValue = this.values.get("spritesheet");
    spritesheetValue?.onChanged(() => {
      const sprite = this.#sprite;
      if (!sprite) return;
      void this.#getTextures().then(textures => {
        sprite.textures = textures;
        sprite.play();
      });
    });
  }

  async #getTextures(): Promise<PIXI.Texture[]> {
    if (this.spritesheet === "") return [PIXI.Texture.WHITE];

    const spritesheet = await PIXI.Assets.load(this.game.resolveResource(this.spritesheet));
    if (!(spritesheet instanceof PIXI.Spritesheet)) {
      throw new TypeError("texture is not a pixi sritesheet");
    }

    return Object.values(spritesheet.textures);
  }

  async onInitialize() {
    super.onInitialize();
    if (!this.container) return;

    const textures = await this.#getTextures();
    this.#sprite = new PIXI.AnimatedSprite(textures);

    this.#sprite.width = this.width * this.globalTransform.scale.x;
    this.#sprite.height = this.height * this.globalTransform.scale.y;
    this.#sprite.anchor.set(0.5);
    this.#sprite.alpha = this.alpha;
    this.#sprite.animationSpeed = this.speed;
    this.#sprite.loop = this.loop;
    this.#sprite.play();

    this.container.addChild(this.#sprite);
  }
}
