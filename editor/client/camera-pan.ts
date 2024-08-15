import { Behavior, Gizmo, MouseDown, MouseUp } from "@dreamlab/engine";
import { InspectorUI } from "./inspector/inspector.ts";

export class CameraPanBehavior extends Behavior {
  #wasDragging: boolean = false;
  ui: InspectorUI | undefined;

  onInitialize(): void {
    if (!this.game.isClient()) return;
    this.listen(this.game.inputs, MouseDown, this.onMouseDown.bind(this));
    this.listen(this.game.inputs, MouseUp, this.onMouseUp.bind(this));
  }

  onMouseDown(event: MouseDown) {
    if (!this.game.isClient()) return;
  }
  onMouseUp(event: MouseUp) {
    if (!this.game.isClient()) return;

    if (!this.#wasDragging && event.cursor.world) {
      const gizmo = this.game.local?.children.get("Gizmo")?.cast(Gizmo);
      if (!gizmo) return;

      const entities = this.game.entities
        .lookupByPosition(event.cursor.world)
        .filter(entity => this.ui?.sceneGraph?.entryElementMap?.has(entity.ref) ?? true)
        .toSorted((a, b) => a.z - b.z);
      const entity = entities.at(0);
      gizmo.target = entity;
      if (this.ui) this.ui.selectedEntity.entities = entity ? [entity] : [];
    }
  }
}
