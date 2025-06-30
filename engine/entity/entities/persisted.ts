import { Entity, JsonValue, sync } from "@dreamlab/engine";

export class PersistedEntity extends Entity {
  // #region boilerplate
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "💾";
  readonly bounds = undefined;
  // #endregion

  // define a synced object
  @sync()
  readonly synced = { clicked: 0 };

  onInitialize(): void {
    super.onInitialize();
    console.log(this.synced);
  }

  protected saveDataForScene(): JsonValue | undefined {
    // persist to project.json
    // you may apply any kind of transform for efficient packing
    return this.synced;
  }

  protected loadDataForScene(value: JsonValue | undefined): void {
    // receive the saved json value and assign back to synced object
    // undo any transforms here
    Object.assign(this.synced, value);
  }
}
