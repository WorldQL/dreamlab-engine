import { BoxResizeGizmo, ClientGame, Entity, Gizmo, Root } from "@dreamlab/engine";
import { EditorRootFacadeEntity } from "../../common/mod.ts";

export class InitSelectedEntityService {
  constructor(public svc: SelectedEntityService) {}
}

export class SelectedEntityService {
  #changeListeners: ((selected: readonly Entity[]) => void)[] = [];
  listen(listener: (selected: readonly Entity[]) => void) {
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

    for (const listener of this.#changeListeners) listener(newEntities);
  }

  get #gizmo() {
    const gizmo = this.game.local.children.get("Gizmo")?.cast(Gizmo);
    const boxresize = this.game.local.children.get("BoxResizeGizmo")?.cast(BoxResizeGizmo);

    return gizmo ?? boxresize;
  }

  constructor(private game: ClientGame) {
    game.fire(InitSelectedEntityService, this);
  }
}
