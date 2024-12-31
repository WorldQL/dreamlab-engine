import { Behavior, Entity, RelativeEntity, EntityRef } from "@dreamlab/engine";

export default class Test extends Behavior {
  byRel: Entity | undefined = undefined;
  byRef: Entity | undefined = undefined;

  override setup(): void {
    this.defineValue(Test, "byRel", { type: RelativeEntity });
    this.defineValue(Test, "byRef", { type: EntityRef });
  }
}
