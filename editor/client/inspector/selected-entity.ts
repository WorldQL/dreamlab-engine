import { ClientGame, Entity, Gizmo } from "@dreamlab/engine";

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
    if (this.#gizmo) this.#gizmo.target = newEntities.at(0);
    for (const listener of this.#changeListeners) listener();
  }

  #gizmo: Gizmo | undefined;

  constructor(private game: ClientGame) {
    this.#gizmo = game.local._.Gizmo.cast(Gizmo);
  }
}
