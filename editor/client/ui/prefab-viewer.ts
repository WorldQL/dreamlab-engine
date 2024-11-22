import {
  Camera,
  ClientGame,
  Entity,
  EntityChildSpawned,
  EntityDestroyed,
  EntityRenamed,
} from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { InspectorUI } from "./inspector.ts";
import { EditorMetadataEntity } from "../../common/mod.ts";
import { SelectedEntityService } from "./selected-entity.ts";
import { UndoRedoManager } from "../undo-redo.ts";

export class PrefabViewer {
  #section = elem("section", { id: "prefab-viewer" });
  #content = elem("div", { id: "prefab-grid" });
  entryElementMap = new Map<string, HTMLElement>();
  currentDragSource: { entities: Entity[]; entries: HTMLElement[] } | undefined;
  prefabsRoot!: Entity;

  constructor(
    private game: ClientGame,
    private container: HTMLElement,
  ) {}

  setup(ui: InspectorUI): void {
    this.#section.append(this.#content);

    this.prefabsRoot = ui.editMode
      ? this.game.world._.EditEntities._.prefabs
      : this.game.prefabs;

    for (const prefab of this.prefabsRoot.children.values()) {
      if (!(prefab instanceof EditorMetadataEntity)) {
        this.renderPrefabCard(ui, prefab);
      }
    }

    ui.selectedEntity.listen(() => {
      for (const [entityRef, card] of this.entryElementMap.entries()) {
        const entity = this.game.entities.lookupByRef(entityRef);
        if (entity && ui.selectedEntity.entities.includes(entity)) {
          card.classList.add("selected");
        } else {
          card.classList.remove("selected");
        }
      }
    });

    this.prefabsRoot.on(EntityChildSpawned, event => {
      const newEntity = event.child;
      if (!(newEntity instanceof EditorMetadataEntity)) {
        this.renderPrefabCard(ui, newEntity);
      }
    });

    this.prefabsRoot.on(EntityDestroyed, () => {
      const card = this.entryElementMap.get(this.prefabsRoot.ref);
      if (card) {
        card.remove();
        this.entryElementMap.delete(this.prefabsRoot.ref);
      }
    });

    this.container.append(this.#section);
  }

  renderPrefabCard(ui: InspectorUI, entity: Entity) {
    if (this.entryElementMap.has(entity.ref)) return;

    const card = elem("div", { className: "prefab-card" }, [
      elem("div", { className: "prefab-icon" }, [
        (entity.constructor as typeof Entity).icon ?? "🌟",
      ]),
      elem("div", { className: "prefab-name" }, [entity.name]),
    ]);

    entity.on(EntityDestroyed, () => {
      card.remove();
      this.entryElementMap.delete(entity.ref);
    });

    entity.on(EntityRenamed, () => {
      const nameElement = card.querySelector(".prefab-name");
      if (nameElement) {
        nameElement.textContent = entity.name;
      }
    });

    card.addEventListener("click", () => {
      ui.selectedEntity.entities = [entity];
    });

    card.draggable = true;
    card.dataset.entity = entity.ref;

    card.addEventListener("dragstart", () => {
      const selectedEntities = ui.selectedEntity.entities;
      const selectedCards = selectedEntities
        .map(e => this.entryElementMap.get(e.ref))
        .filter(e => e !== undefined) as HTMLElement[];

      if (selectedEntities.includes(entity)) {
        this.currentDragSource = {
          entities: selectedEntities as Entity[],
          entries: selectedCards,
        };
        for (const entry of selectedCards) {
          entry.dataset.dragging = "";
        }
      } else {
        this.currentDragSource = {
          entities: [entity],
          entries: [card],
        };
        card.dataset.dragging = "";
      }
    });

    card.addEventListener("dragend", () => {
      // ungainly settimeout hack because the mouse position doesn't update when dragging
      // major deja vu on this (i have done this before)
      setTimeout(() => {
        if (this.currentDragSource) {
          for (const entry of this.currentDragSource.entries) {
            delete entry.dataset.dragging;
          }
        }

        const selectedService = SelectedEntityService.serviceForGame(this.game);
        if (!selectedService) return;
        if (selectedService.entities.length === 0)
          selectedService.entities = [this.game.world._.EditEntities._.world];
        const entity = selectedService?.entities.at(0);
        if (entity && selectedService?.entities.length === 1) {
          this.currentDragSource?.entities.forEach(e => {
            const newEntity = e.cloneInto(entity, {
              transform: { position: this.game.inputs.cursor.world },
            });
            UndoRedoManager._.push({
              t: "create-entity",
              parentRef: entity.ref,
              def: newEntity.getDefinition(),
            });
          });
        }
        this.currentDragSource = undefined;
      }, 20);
    });

    this.entryElementMap.set(entity.ref, card);
    this.#content.append(card);
  }
}
