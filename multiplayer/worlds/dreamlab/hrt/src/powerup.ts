import {
  Behavior,
  Collider,
  Entity,
  RelativeEntity,
  Sprite,
  TextureAdapter,
  optionsAdapter,
  syncedValue,
} from "@dreamlab/engine";
import type Horse from "./horse.ts";

export type PowerupType = optionsAdapter.Union<typeof PowerupTypeAdapter>;
export const PowerupTypes = ["speed-boost", "stun", "obstacle"] as const;
export const PowerupTypeAdapter = optionsAdapter(PowerupTypes);

export default class Powerup extends Behavior {
  @syncedValue(PowerupTypeAdapter)
  type: PowerupType = "speed-boost";

  @syncedValue(TextureAdapter)
  speedBoostTex: string = "";
  @syncedValue(TextureAdapter)
  stunTex: string = "";
  @syncedValue(TextureAdapter)
  obstacleTex: string = "";

  @syncedValue(RelativeEntity)
  collider: Entity | undefined;
  @syncedValue(RelativeEntity)
  sprite: Entity | undefined;

  onInitialize(): void {
    this.#updateType();

    const typeValue = this.values.get("type");
    typeValue?.onChanged(() => {
      this.#updateType();
    });

    // obstacles trigger immediately
    if (this.type === "obstacle") {
      const duration = this.#duration * 1000;
      const endsAt = this.time.now + duration;

      this.#active = { type: "obstacle", endsAt };
    }
  }

  onTick(): void {
    if (!this.#active) return;
    if (this.time.now >= this.#active.endsAt) {
      this.#reset();
      this.entity.destroy();
    }
  }

  get #texture(): string {
    if (this.type === "speed-boost") return this.speedBoostTex;
    else if (this.type === "stun") return this.stunTex;
    else if (this.type === "obstacle") return this.obstacleTex;
    else throw new Error(`missing texture for type: ${this.type}`);
  }

  /** seconds */
  get #duration(): number {
    if (this.type === "speed-boost") return 5;
    else if (this.type === "stun") return 2;
    else if (this.type === "obstacle") return 10;
    else throw new Error(`missing duration for type: ${this.type}`);
  }

  #updateType(): void {
    if (!this.collider) throw new Error("missing collider reference");
    if (!this.sprite) throw new Error("missing sprite reference");

    const collider = this.collider.cast(Collider);
    const sprite = this.sprite.cast(Sprite);

    collider.isSensor = this.type !== "obstacle";
    sprite.texture = this.#texture;

    // TODO: remove tint (used for debugging in the absence of textures)
    sprite.tint = this.type === "speed-boost" ? "green" : this.type === "stun" ? "red" : "blue";
  }

  #active:
    | { type: Extract<PowerupType, "obstacle">; endsAt: number }
    | {
        type: Exclude<PowerupType, "obstacle">;
        endsAt: number;
        data: { horse: Horse; speed: number };
      }
    | undefined;

  trigger(horse: Horse): boolean {
    if (this.type === "obstacle") {
      // do nothing
      return false;
    }

    // prevent re-triggers
    if (this.#active !== undefined) return true;

    if (!this.collider) throw new Error("missing collider reference");
    if (!this.sprite) throw new Error("missing sprite reference");

    this.collider.enabled = false;
    this.sprite.enabled = false;

    const duration = this.#duration * 1000;
    const endsAt = this.time.now + duration;
    const speed = horse.speed;
    this.#active = { type: this.type, endsAt, data: { horse, speed } };

    if (this.type === "speed-boost") {
      horse.speed *= 2;
    } else if (this.type === "stun") {
      horse.speed = 0;
    } else {
      console.warn(`powerup not implemented: ${this.type}`);
    }

    return true;
  }

  #reset(): void {
    if (!this.#active) return;
    const active = this.#active;
    this.#active = undefined;
    if (active.type === "obstacle") return;

    const data = active.data;
    data.horse.speed = data.speed;
  }
}
