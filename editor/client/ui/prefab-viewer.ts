import {
  ClientGame,
  Entity,
  EntityChildSpawned,
  EntityDestroyed,
  EntityRenamed,
  getFacadeRoot,
} from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { EditorMetadataEntity } from "../../common/mod.ts";
import { UndoRedoManager } from "../undo-redo.ts";
import { createEntityMenu } from "../util/entity-types.ts";
import { ContextMenuItem } from "./context-menu.ts";
import { IconPicker } from "./icon-picker.ts";
import { InspectorUI } from "./inspector.ts";

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

    this.#content.addEventListener("click", (event: MouseEvent) => {
      if (!(event.target instanceof HTMLElement) || !event.target.closest(".prefab-card")) {
        ui.selectedEntity.entities = [];
        this.#content.querySelectorAll(".prefab-card.preselected").forEach(el => {
          el.classList.remove("preselected");
        });
      }
    });

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

    card.addEventListener("click", (event: MouseEvent) => {
      event.stopPropagation();

      this.#content.querySelectorAll(".prefab-card.preselected").forEach(el => {
        if (el !== card) {
          el.classList.remove("preselected");
        }
      });
      ui.selectedEntity.entities = [];
      card.classList.add("preselected");
    });

    card.addEventListener("dblclick", (event: MouseEvent) => {
      event.stopPropagation();
      card.classList.remove("preselected");
      ui.selectedEntity.entities = [entity];
    });

    card.addEventListener("contextmenu", (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!ui.selectedEntity.entities.includes(entity)) {
        ui.selectedEntity.entities = [entity];
      }

      const contextMenuItems: ContextMenuItem[] = [
        [
          "Rename",
          () => {
            this.triggerRename(entity, card);
          },
          false,
          "F2",
        ],
        [
          ...createEntityMenu("Add Child Entity", type => {
            const newEntity = entity.spawn({
              type: type,
              name: type.name,
            });

            UndoRedoManager._.push({
              t: "create-entity",
              parentRef: entity.ref,
              def: newEntity.getDefinition(),
            });

            ui.selectedEntity.entities = [newEntity];
          }),
        ],
        // [
        //   "Change Icon",
        //   () => {
        //     this.openIconPicker(event.clientX, event.clientY, entity);
        //   },
        //   false,
        // ],
        [
          "Delete",
          () => {
            const parent = entity.parent;
            if (parent) {
              UndoRedoManager._.push({
                t: "destroy-entity",
                def: entity.getDefinition(),
                parentRef: parent.ref,
              });
              entity.destroy();
              ui.selectedEntity.entities = [];
            }
          },
          false,
          "Backspace",
        ],
      ];

      ui.contextMenu.drawContextMenu(event.clientX, event.clientY, contextMenuItems);
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
      setTimeout(() => {
        if (this.currentDragSource) {
          for (const entry of this.currentDragSource.entries) {
            delete entry.dataset.dragging;
          }
        }

        const canvas = this.game.renderer.app.canvas;
        const screenPos = this.game.inputs.cursor.screen;
        if (!screenPos) {
          this.currentDragSource = undefined;
          return;
        }

        if (
          screenPos.x < 0 ||
          screenPos.y < 0 ||
          screenPos.x > canvas.width ||
          screenPos.y > canvas.height
        ) {
          this.currentDragSource = undefined;
          return;
        }

        let parentEntity = undefined;

        if (ui.selectedEntity.entities.length === 0) {
          parentEntity = this.game.world._.EditEntities._.world;
        } else {
          const facadeRoot = getFacadeRoot(ui.selectedEntity.entities[0]);
          if (facadeRoot.constructor.name === "PrefabRootFacade") {
            parentEntity = this.game.world._.EditEntities._.world;
          } else {
            parentEntity = facadeRoot;
          }
        }

        if (parentEntity && this.currentDragSource) {
          const spawnPosition = this.game.inputs.cursor.world;

          const newEntities: Entity[] = [];
          this.currentDragSource.entities.forEach(e => {
            const newEntity = e.cloneInto(parentEntity, {
              transform: { position: spawnPosition },
              enabled: true,
            });
            UndoRedoManager._.push({
              t: "create-entity",
              parentRef: parentEntity.ref,
              def: newEntity.getDefinition(),
            });
            newEntities.push(newEntity);
            ui.selectedEntity.entities = [newEntity];
          });
        }

        this.currentDragSource = undefined;
      }, 20);
    });

    this.entryElementMap.set(entity.ref, card);
    this.#content.append(card);
  }

  private addContextMenu(ui: InspectorUI) {
    this.#content.addEventListener("contextmenu", (event: MouseEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest(".prefab-card")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const entityMenu: ContextMenuItem = createEntityMenu("New Prefab", type => {
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
      });

      const contextMenuItems: ContextMenuItem[] = [entityMenu];

      ui.contextMenu.drawContextMenu(event.clientX, event.clientY, contextMenuItems);
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

  private triggerRename(entity: Entity, card: HTMLElement) {
    const nameElement = card.querySelector(".prefab-name") as HTMLElement;
    if (!nameElement) return;

    const previousName = entity.name;

    nameElement.style.display = "none";
    const input = elem("input", {
      type: "text",
      value: entity.name,
      className: "rename-input",
    }) as HTMLInputElement;
    card.appendChild(input);
    input.focus();
    input.select();

    const reset = () => {
      nameElement.style.display = "inherit";
      input.remove();
    };

    input.addEventListener("keypress", event => {
      if (event.key === "Enter") {
        input.blur();
      }
    });

    input.addEventListener("blur", () => {
      const newName = input.value.trim();
      if (newName && newName !== entity.name) {
        entity.name = newName;

        nameElement.textContent = newName;

        UndoRedoManager._.push({
          t: "rename-entity",
          entityRef: entity.ref,
          previous: previousName,
          name: newName,
        });
      }
      reset();
    });
  }
}
