import { ClientGame, Entity, Root } from "@dreamlab/engine";
import { BoxResizeGizmo, Gizmo } from "../../common/entities/mod.ts";
import { EditorRootFacadeEntity } from "../../common/mod.ts";

export const internalSelectedService = Symbol.for("dreamlab.engine.internalSelectedService");
export class InitSelectedEntityService {
  constructor(public svc: SelectedEntityService) {}
}

type OnSelectedFn = (selected: readonly Entity[]) => void;
export class SelectedEntityService {
  #changeListeners = new Set<OnSelectedFn>();
  listen(listener: OnSelectedFn): { unsubscribe: () => void } {
    this.#changeListeners.add(listener);

    return {
      unsubscribe: () => {
        this.#changeListeners.delete(listener);
      },
    };
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
    // @ts-expect-error: internal injection
    game[internalSelectedService] = this;
  }

  static serviceForGame(game: ClientGame): SelectedEntityService | undefined {
    // @ts-expect-error: internal injection
    return game[internalSelectedService];
  }
}
