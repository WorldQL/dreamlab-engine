import { Entity } from "../entity.ts";

/**
 * An entity with nothing but a transform.
 * Used as a container.
 */
export class Empty extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  public static readonly icon = "📦";
  readonly bounds = Object.freeze({ x: 0.5, y: 0.5 });
}
