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
import { UndoRedoManager } from "../undo-redo.ts";
import { IconPicker } from "./icon-picker.ts";
import { createEntityMenu } from "../util/entity-types.ts";

export class PrefabViewer {
  #section = elem("section", { id: "prefab-viewer" });
  #content = elem("div", { id: "prefab-grid" });
  #noPrefabsMessage = elem("div", { className: "no-prefabs-message" }, [
    "No prefabs created. Create a new prefab to get started!",
  ]);
  entryElementMap = new Map<string, HTMLElement>();
  currentDragSource: { entities: Entity[]; entries: HTMLElement[] } | undefined;
  prefabsRoot!: Entity;
  #iconPicker: IconPicker;

  constructor(private game: ClientGame, private container: HTMLElement) {
    this.#iconPicker = new IconPicker((newIcon: string) => {
      this.changeEntityIcon(this.inspectorUI, newIcon);
    });
  }

  private inspectorUI!: InspectorUI;

  setup(ui: InspectorUI): void {
    this.inspectorUI = ui;
    this.#section.append(this.#content);

    this.prefabsRoot = ui.editMode
      ? this.game.world._.EditEntities._.prefabs
      : this.game.prefabs;

    if (this.prefabsRoot.children.size === 0) {
      this.#content.append(this.#noPrefabsMessage);
    } else {
      for (const prefab of this.prefabsRoot.children.values()) {
        if (!(prefab instanceof EditorMetadataEntity)) {
          this.renderPrefabCard(ui, prefab);
        }
      }
    }

    this.addContextMenu(ui);

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
      this.#noPrefabsMessage.remove();
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
      this.checkForNoPrefabs();
    });

    this.container.append(this.#section);
  }

  renderPrefabCard(ui: InspectorUI, entity: Entity) {
    if (this.entryElementMap.has(entity.ref)) return;

    const card = elem("div", { className: "prefab-card" }, [
      elem("div", { className: "prefab-icon" }, [entity.icon ?? "🌟"]),
      elem("div", { className: "prefab-name" }, [entity.name]),
    ]);

    entity.on(EntityDestroyed, () => {
      card.remove();
      this.entryElementMap.delete(entity.ref);
      this.checkForNoPrefabs();
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

    // TODO: Implement this feature or something else to disambiguate prefabs.
    // card.addEventListener("contextmenu", event => {
    //   event.preventDefault();
    //   event.stopPropagation();
    //   ui.selectedEntity.entities = [entity];

    //   const contextMenuItems: ContextMenuItem[] = [
    //     [
    //       "Change Icon",
    //       () => {
    //         this.openIconPicker(event.clientX, event.clientY, entity);
    //       },
    //       false,
    //     ],
    //   ];

    //   ui.contextMenu.drawContextMenu(event.clientX, event.clientY, contextMenuItems);
    // });

    card.draggable = true;
    card.dataset.entity = entity.ref;

    this.entryElementMap.set(entity.ref, card);
    this.#content.append(card);
  }

  private addContextMenu(ui: InspectorUI) {
    this.#content.addEventListener("contextmenu", event => {
      event.preventDefault();
      event.stopPropagation();

      ui.contextMenu.drawContextMenu(event.clientX, event.clientY, [
        createEntityMenu("New Prefab", type => {
          const newEntity = this.prefabsRoot.spawn({
            type: type,
            name: type.name,
          });

          UndoRedoManager._.push({
            t: "create-entity",
            parentRef: this.prefabsRoot.ref,
            def: newEntity.getDefinition(),
          });

          ui.selectedEntity.entities = [newEntity];
        }),
      ]);
    });
  }

  private checkForNoPrefabs() {
    if (this.prefabsRoot.children.size === 0) {
      this.#content.append(this.#noPrefabsMessage);
    }
  }

  private openIconPicker(x: number, y: number, entity: Entity) {
    this.#iconPicker.open(x, y, () => {});
    this.#iconPicker.onSelect = (icon: string) => {
      entity.icon = icon;

      const card = this.entryElementMap.get(entity.ref);
      if (card) {
        const iconElement = card.querySelector(".prefab-icon");
        if (iconElement) iconElement.textContent = icon;
      }
    };
  }

  private changeEntityIcon(ui: InspectorUI, newIcon: string) {
    const selectedEntity = ui.selectedEntity?.entities[0];
    if (selectedEntity) {
      selectedEntity.icon = newIcon;

      const card = this.entryElementMap.get(selectedEntity.ref);
      if (card) {
        const iconElement = card.querySelector(".prefab-icon");
        if (iconElement) iconElement.textContent = newIcon;
      }
    }
  }
}
