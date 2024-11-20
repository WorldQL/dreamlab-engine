import {
  ClientGame,
  Entity,
  EntityChildSpawned,
  EntityDestroyed,
  EntityRenamed,
} from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { InspectorUI } from "./inspector.ts";
import { EditorMetadataEntity } from "../../common/mod.ts";

export class PrefabViewer {
  #section = elem("section", { id: "prefab-viewer" });
  #content = elem("div", { id: "prefab-grid" });
  entryElementMap = new Map<string, HTMLElement>();
  currentDragSource: { entities: Entity[]; entries: HTMLElement[] } | undefined;
  prefabsRoot!: Entity;

  constructor(private game: ClientGame, private container: HTMLElement) {}

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
      if (this.currentDragSource) {
        for (const entry of this.currentDragSource.entries) {
          delete entry.dataset.dragging;
        }
      }
      this.currentDragSource = undefined;
    });

    this.entryElementMap.set(entity.ref, card);
    this.#content.append(card);
  }
}
