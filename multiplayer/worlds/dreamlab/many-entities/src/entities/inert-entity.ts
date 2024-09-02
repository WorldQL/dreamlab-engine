import { Entity } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";

export class InertEntity extends Entity {
  static {
    Entity.registerType(this, "@many-entities-custom");
  }

  static icon = "⏳";

  bounds = undefined;

  [internal.preTickEntities]() {}
  [internal.tickEntities]() {}
  [internal.updateInterpolation]() {}
}
