import { Entity, EntityContext } from "../entity.ts";

/** An entity with nothing but a transform. Used as a container. */
export class Empty extends Entity {
  public static readonly icon = "📦";

  constructor(ctx: EntityContext) {
    super(ctx);
  }
}
Entity.registerType(Empty, "@core");
