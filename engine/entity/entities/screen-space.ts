import { Entity } from "@dreamlab/engine";

// marker entity, does nothing on its own

export class ScreenSpace extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🖥️";
  readonly bounds = undefined;
}
