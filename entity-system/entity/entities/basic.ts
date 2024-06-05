import { Entity, EntityContext } from "../entity.ts";

/** Only exists for testing, will be removed later. */
export class BasicEntity extends Entity {
  constructor(ctx: EntityContext) {
    super(ctx);
  }
}
Entity.registerType(BasicEntity, "@core");
