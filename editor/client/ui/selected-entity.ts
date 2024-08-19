import { BoxResizeGizmo, ClientGame, Entity, Gizmo, Root } from "@dreamlab/engine";
import { EditorRootFacadeEntity } from "../../common/mod.ts";

export class SelectedEntityService {
  #changeListeners: (() => void)[] = [];
  listen(listener: () => void) {
    this.#changeListeners.push(listener);
  }

  #entities: ReadonlyArray<Entity> = [];
  get entities() {
    return this.#entities;
  }
  set entities(newEntities) {
    this.#entities = newEntities;

    const gizmo = this.#gizmo;
    if (gizmo) {
      gizmo.target = newEntities
        .filter(e => !(e instanceof Root || e instanceof EditorRootFacadeEntity))
        .at(0);
    }

    for (const listener of this.#changeListeners) listener();
  }

  get #gizmo() {
    const gizmo = this.game.local.children.get("Gizmo")?.cast(Gizmo);
    const boxresize = this.game.local.children.get("BoxResizeGizmo")?.cast(BoxResizeGizmo);

    return gizmo ?? boxresize;
  }

  constructor(private game: ClientGame) {}
}
