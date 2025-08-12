import {
  Camera,
  ClientGame,
  Entity,
  EntityChildReparented,
  EntityChildSpawned,
  EntityDestroyed,
  EntityRenamed,
  EntityReparented,
  getFacadeRoot,
  Vector2,
} from "@dreamlab/engine";
import { EditorMetadataEntity } from "../../common/mod.ts";
import { UndoRedoManager } from "../undo-redo.ts";
import { createEntityMenu } from "../util/entity-types.ts";
import { ContextMenuItem } from "./context-menu.ts";
import { IconPicker } from "./icon-picker.ts";
import { InspectorUI } from "./inspector.ts";

export class PrefabViewer {
  #section = (<section id="prefab-viewer" style={{ position: "relative" }} />);
  #content = (<div id="prefab-grid" />) as HTMLElement;
  #noPrefabsMessage = (
    <div className="no-prefabs-message">
      No prefabs created. Create a new prefab to get started!
    </div>
  );

  entryElementMap = new Map<string, HTMLElement>();
  currentDragSource: { entities: Entity[]; entries: HTMLElement[] } | undefined;
  prefabsRoot!: Entity;
  #iconPicker: IconPicker;

  static singleplayerMode = true;

  private dropRoot: "world" | "local" | "server";

  private getDropRootEntity(): Entity {
    const edit = this.game.world._.EditEntities;
    switch (this.dropRoot) {
      case "local":
        return edit._.local ?? edit._.world;
      case "server":
        return edit._.server ?? edit._.world;
      case "world":
      default:
        return edit._.world;
    }
  }

  constructor(
    private game: ClientGame,
    private container: HTMLElement,
  ) {
    this.#iconPicker = new IconPicker((newIcon: string) => {
      this.changeEntityIcon(this.inspectorUI, newIcon);
    });

    const key = `@dreamlab_${this.game.instanceId}_prefab-drop-root`;
    const stored = localStorage.getItem(key) as "world" | "local" | "server" | null;

    if (stored) {
      this.dropRoot = stored;
    } else if (PrefabViewer.singleplayerMode) {
      this.dropRoot = "local";
      localStorage.setItem(key, "local");
    } else {
      this.dropRoot = "world";
    }
  }

  private inspectorUI!: InspectorUI;

  setup(ui: InspectorUI): void {
    this.inspectorUI = ui;

    const dropSelect = (
      <select
        className="prefab-drop-root-select"
        title="Choose the default parent for dropped prefabs"
        value={this.dropRoot}
        style={{
          padding: "2px 6px",
          borderRadius: "var(--border-radius)",
          fontSize: "12px",
          background: "rgb(var(--color-bg-1))",
          color: "rgb(var(--color-text))",
          border: "1px solid rgb(var(--color-grey-lighter))",
        }}
        onChange={e => {
          const v = (e.target as HTMLSelectElement).value as "world" | "local" | "server";
          this.dropRoot = v;
          localStorage.setItem(`@dreamlab_${this.game.instanceId}_prefab-drop-root`, v);
          dropSelect.value = v;
        }}
      >
        <option value="world">world</option>
        <option value="local">local</option>
        <option value="server">server</option>
      </select>
    ) as HTMLSelectElement;

    dropSelect.value = this.dropRoot;

    const dropContainer = (
      <div
        style={{
          position: "absolute",
          top: "2px",
          right: "2px",
          display: "flex",
          gap: "4px",
          alignItems: "center",
          fontSize: "11px",
          padding: "4px 8px",
          borderRadius: "4px",
          background: "rgba(var(--color-bg-2) / 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: "100",
        }}
      >
        <span
          style={{
            opacity: 0.75,
            textDecorationStyle: "dotted",
            textDecorationLine: "underline",
            cursor: "help",
          }}
          title="If you have no entity selected when dragging a prefab into the world, it will go under this tree. When you have an entity selected, the prefab will be created under it. For multiplayer games, you usually want this to be 'world' and for singleplayer games you usually want 'local'."
        >
          Default drop
        </span>
        {dropSelect}
      </div>
    ) as HTMLDivElement;

    this.#section.append(dropContainer, this.#content);

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

    this.prefabsRoot.on(EntityChildReparented, event => {
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
    if (entity.name.startsWith(".")) return; // hide prefab from bottom pane. useful if you use it in code but don't want it to show in the spawn panel.
    if (this.entryElementMap.has(entity.ref)) return;

    let card: HTMLDivElement;

    const click = (event: MouseEvent) => {
      event.stopPropagation();

      this.#content.querySelectorAll(".prefab-card.preselected").forEach(el => {
        if (el !== card) {
          el.classList.remove("preselected");
        }
      });
      ui.selectedEntity.entities = [];
      card.classList.add("preselected");
    };

    const dblclick = (event: MouseEvent) => {
      event.stopPropagation();
      card.classList.remove("preselected");
      ui.selectedEntity.entities = [entity];
    };

    const contextmenu = (event: MouseEvent) => {
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
    };

    const dragstart = () => {
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
    };

    const dragend = (event: DragEvent) => {
      if (this.currentDragSource) {
        for (const entry of this.currentDragSource.entries) {
          delete entry.dataset.dragging;
        }
      }

      // Update cursor position from drag event coordinates
      const canvas = this.game.renderer.app.canvas;
      const canvasRect = canvas.getBoundingClientRect();
      const canvasCoords = {
        x: event.clientX - canvasRect.x,
        y: event.clientY - canvasRect.y,
      };

      // Check if drop is within canvas bounds
      if (
        canvasCoords.x < 0 ||
        canvasCoords.y < 0 ||
        canvasCoords.x > canvasRect.width ||
        canvasCoords.y > canvasRect.height
      ) {
        this.currentDragSource = undefined;
        return;
      }

      // Calculate world position directly from canvas coordinates
      const screenPos = new Vector2(canvasCoords);
      const camera = Camera.getActive(this.game);
      const worldPos = camera ? camera.screenToWorld(screenPos) : undefined;

      let parentEntity: Entity | undefined;

      if (ui.selectedEntity.entities.length === 0) {
        parentEntity = this.getDropRootEntity();
      } else {
        const facadeRoot = getFacadeRoot(ui.selectedEntity.entities[0]);
        if (facadeRoot.constructor.name === "PrefabRootFacade") {
          parentEntity = this.getDropRootEntity();
        } else {
          parentEntity = facadeRoot;
        }
      }

      if (parentEntity && this.currentDragSource && worldPos) {
        const newEntities: Entity[] = [];
        this.currentDragSource.entities.forEach(e => {
          const newEntity = e.cloneInto(parentEntity, {
            transform: { position: worldPos },
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
    };

    card = (
      <div
        className="prefab-card"
        id={`prefab-tab-` + entity.name}
        draggable
        data-entity={entity.ref}
        onClick={click}
        onDblClick={dblclick}
        onContextMenu={contextmenu}
        onDragStart={dragstart}
        onDragEnd={dragend}
      >
        <div className="prefab-icon emoji">{entity.icon ?? "🌟"}</div>
        <div className="prefab-name">{entity.name}</div>
      </div>
    ) as HTMLDivElement;

    this.entryElementMap.set(entity.ref, card);
    this.#content.append(card);

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

    entity.on(EntityReparented, evt => {
      if (
        evt.oldParent.id === this.prefabsRoot.id &&
        entity.parent?.id !== this.prefabsRoot.id
      ) {
        card.remove();
        this.entryElementMap.delete(entity.ref);
        this.checkForNoPrefabs();
      }
    });
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
    const input = (
      <input
        type="text"
        className="rename-input"
        value={entity.name}
        _also={it => {
          card.appendChild(it);
          it.focus();
          it.select();
        }}
      />
    ) as HTMLInputElement;

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
