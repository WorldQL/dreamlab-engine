import { Entity } from "@dreamlab/engine";

/**
 * An entity with nothing but a transform.
 * Used as a container.
 */
export class Empty extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon: string = "📦";
  readonly bounds = undefined;
}
