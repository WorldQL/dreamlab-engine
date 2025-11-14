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
  PixiEntity,
  Vector2,
} from "@dreamlab/engine";
import { EditorMetadataEntity } from "../../common/mod.ts";
import { EmptyFacade } from "../../common/facades/empty.ts";
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
      No prefabs created. Create a new prefab to get started.
    </div>
  );

  entryElementMap = new Map<string, HTMLElement>();
  currentDragSource: { entities: Entity[]; entries: HTMLElement[] } | undefined;
  prefabsRoot!: Entity;
  #iconPicker: IconPicker;
  #currentFolder: Entity | null = null;
  #refreshTimeout: number | undefined;
  #entityListeners = new Set<string>();
  #breadcrumbContainer!: HTMLDivElement;
  #dragPreviewEntities: Entity[] = [];
  #dragPreviewParent: Entity | undefined;

  static instance: PrefabViewer | undefined = undefined;

  private dropRoot: "world" | "local" | "server" = "world";

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
    PrefabViewer.instance = this;
    this.updateDropRoot();
  }

  public updateDropRoot(isSingleplayerMode = false) {
    const key = `@dreamlab_${this.game.instanceId}_prefab-drop-root`;
    const stored = localStorage.getItem(key) as "world" | "local" | "server" | null;
    if (stored) {
      this.dropRoot = stored;
    } else if (isSingleplayerMode) {
      this.dropRoot = "local";
      localStorage.setItem(key, "local");
    }

    const d = document.getElementById("prefab-drop-root-select") as HTMLSelectElement;
    if (d) d.value = this.dropRoot;
  }

  private inspectorUI!: InspectorUI;

  setup(ui: InspectorUI): void {
    this.inspectorUI = ui;

    const dropSelect = (
      <select
        id="prefab-drop-root-select"
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
          zIndex: "95",
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

    this.#breadcrumbContainer = (<div className="prefab-breadcrumbs" />) as HTMLDivElement;

    this.#section.append(this.#breadcrumbContainer, dropContainer, this.#content);

    this.prefabsRoot = ui.editMode
      ? this.game.world._.EditEntities._.prefabs
      : this.game.prefabs;

    this.refreshView();

    this.#content.addEventListener("click", (event: MouseEvent) => {
      if (
        !(event.target instanceof HTMLElement) ||
        (!event.target.closest(".prefab-card") &&
          !event.target.closest(".prefab-back-button") &&
          !event.target.closest(".prefab-folder"))
      ) {
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

    const refreshOnChange = () => {
      if (this.#currentFolder === null || this.#currentFolder === this.prefabsRoot) {
        this.refreshView();
      }
    };

    this.prefabsRoot.on(EntityChildSpawned, refreshOnChange);
    this.prefabsRoot.on(EntityChildReparented, refreshOnChange);
    this.prefabsRoot.on(EntityDestroyed, refreshOnChange);

    this.container.append(this.#section);
  }

  renderPrefabCard(ui: InspectorUI, entity: Entity) {
    if (entity.name.startsWith(".")) return;
    if (this.entryElementMap.has(entity.ref)) return;

    const isFolder = entity instanceof EmptyFacade && entity.isFolder;
    let card: HTMLDivElement;

    const click = (event: MouseEvent) => {
      event.stopPropagation();

      if (isFolder) {
        this.navigateToFolder(entity);
      } else {
        this.#content.querySelectorAll(".prefab-card.preselected").forEach(el => {
          if (el !== card) {
            el.classList.remove("preselected");
          }
        });
        ui.selectedEntity.entities = [];
        card.classList.add("preselected");
      }
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

    const dragstart = (event: DragEvent) => {
      if (isFolder) return;

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

      if (event.dataTransfer) {
        const emptyImage = document.createElement("img");
        emptyImage.src =
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        event.dataTransfer.setDragImage(emptyImage, 0, 0);
      }

      const canvas = this.game.renderer.app.canvas;
      const canvasRect = canvas.getBoundingClientRect();
      const canvasCoords = {
        x: event.clientX - canvasRect.x,
        y: event.clientY - canvasRect.y,
      };

      const screenPos = new Vector2(canvasCoords);
      const camera = Camera.getActive(this.game);
      const worldPos = camera ? camera.screenToWorld(screenPos) : new Vector2(0, 0);

      this.#createDragPreview(worldPos);
    };

    const drag = (event: DragEvent) => {
      if (!this.currentDragSource) return;

      const canvas = this.game.renderer.app.canvas;
      const canvasRect = canvas.getBoundingClientRect();
      const canvasCoords = {
        x: event.clientX - canvasRect.x,
        y: event.clientY - canvasRect.y,
      };

      const screenPos = new Vector2(canvasCoords);
      const camera = Camera.getActive(this.game);
      const worldPos = camera ? camera.screenToWorld(screenPos) : new Vector2(0, 0);

      this.#updateDragPreviewPosition(worldPos);
    };

    const dragend = (event: DragEvent) => {
      if (this.currentDragSource) {
        for (const entry of this.currentDragSource.entries) {
          delete entry.dataset.dragging;
        }
      }

      const canvas = this.game.renderer.app.canvas;
      const canvasRect = canvas.getBoundingClientRect();
      const canvasCoords = {
        x: event.clientX - canvasRect.x,
        y: event.clientY - canvasRect.y,
      };

      const onCanvas =
        canvasCoords.x >= 0 &&
        canvasCoords.y >= 0 &&
        canvasCoords.x <= canvasRect.width &&
        canvasCoords.y <= canvasRect.height;

      if (!onCanvas) {
        this.#cleanupDragPreview();
        this.currentDragSource = undefined;
        return;
      }

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

      this.#cleanupDragPreview();
      this.currentDragSource = undefined;
    };

    if (isFolder) {
      card = (
        <div
          className="prefab-folder"
          id={`prefab-tab-` + entity.name}
          data-entity={entity.ref}
          data-folder="true"
          onClick={click}
          onDblClick={dblclick}
          onContextMenu={contextmenu}
        >
          <div className="prefab-icon emoji">{entity.icon}</div>
          <div className="prefab-name">{entity.name}</div>
        </div>
      ) as HTMLDivElement;
    } else {
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
          onDrag={drag}
          onDragEnd={dragend}
        >
          <div className="prefab-icon emoji">{entity.icon}</div>
          <div className="prefab-name">{entity.name}</div>
        </div>
      ) as HTMLDivElement;
    }

    this.entryElementMap.set(entity.ref, card);
    this.#content.append(card);

    entity.on(EntityDestroyed, () => {
      if (this.#currentFolder === entity) {
        this.navigateToFolder(null);
      } else {
        this.refreshView();
      }
    });

    entity.on(EntityRenamed, () => {
      const nameElement = card.querySelector(".prefab-name");
      if (nameElement) {
        nameElement.textContent = entity.name;
      }

      const iconElement = card.querySelector(".prefab-icon");
      if (iconElement) {
        iconElement.textContent = entity.icon;
      }
    });

    entity.on(EntityReparented, () => {
      this.refreshView();
    });

    if (entity instanceof EmptyFacade && !this.#entityListeners.has(entity.ref)) {
      this.#entityListeners.add(entity.ref);
      const isFolderValue = entity.values.get("isFolder");
      isFolderValue?.onChanged(() => {
        this.refreshView();
      });

      entity.on(EntityDestroyed, () => {
        this.#entityListeners.delete(entity.ref);
      });
    }

    if (isFolder) {
      const folderRefreshOnChange = () => {
        if (this.#currentFolder === entity) {
          this.refreshView();
        }
      };

      entity.on(EntityChildSpawned, folderRefreshOnChange);
      entity.on(EntityChildReparented, folderRefreshOnChange);
    }
  }

  private navigateToFolder(folder: Entity | null) {
    this.#currentFolder = folder;
    this.refreshView();
  }

  #renderBreadcrumbs(): HTMLElement[] {
    const breadcrumbs: HTMLElement[] = [];

    if (!this.#currentFolder) {
      return breadcrumbs;
    }

    const rootCrumb = (
      <span
        className="breadcrumb-item breadcrumb-link"
        onClick={() => this.navigateToFolder(null)}
      >
        Prefabs
      </span>
    ) as HTMLSpanElement;
    breadcrumbs.push(rootCrumb);

    if (this.#currentFolder) {
      const path: Entity[] = [];
      let current: Entity | undefined = this.#currentFolder;
      while (current && current !== this.prefabsRoot) {
        path.unshift(current);
        current = current.parent;
      }

      for (let i = 0; i < path.length; i++) {
        const folder = path[i];
        breadcrumbs.push(
          (<span className="breadcrumb-separator"> › </span>) as HTMLSpanElement,
        );

        if (i === path.length - 1) {
          breadcrumbs.push(
            (
              <span className="breadcrumb-item breadcrumb-current">{folder.name}</span>
            ) as HTMLSpanElement,
          );
        } else {
          breadcrumbs.push(
            (
              <span
                className="breadcrumb-item breadcrumb-link"
                onClick={() => this.navigateToFolder(folder)}
              >
                {folder.name}
              </span>
            ) as HTMLSpanElement,
          );
        }
      }
    }

    return breadcrumbs;
  }

  private refreshView() {
    if (this.#refreshTimeout !== undefined) {
      clearTimeout(this.#refreshTimeout);
    }

    this.#refreshTimeout = setTimeout(() => {
      this.#doRefresh();
      this.#refreshTimeout = undefined;
    }, 100);
  }

  #doRefresh() {
    this.#content.innerHTML = "";

    this.#breadcrumbContainer.innerHTML = "";
    const breadcrumbs = this.#renderBreadcrumbs();

    if (breadcrumbs.length === 0) {
      this.#breadcrumbContainer.style.display = "none";
    } else {
      this.#breadcrumbContainer.style.display = "flex";
      breadcrumbs.forEach(crumb => this.#breadcrumbContainer.append(crumb));
    }

    if (this.#currentFolder) {
      const parentFolder =
        this.#currentFolder.parent === this.prefabsRoot
          ? null
          : (this.#currentFolder.parent ?? null);
      const backButton = (
        <div className="prefab-back-button" onClick={() => this.navigateToFolder(parentFolder)}>
          <div className="prefab-icon">←</div>
          <div className="prefab-name">Back</div>
        </div>
      ) as HTMLDivElement;
      this.#content.append(backButton);
    }

    this.entryElementMap.clear();
    const currentParent = this.#currentFolder ?? this.prefabsRoot;

    if (currentParent.children.size === 0) {
      this.#content.append(this.#noPrefabsMessage);
      return;
    }

    const children = Array.from(currentParent.children.values());
    const folders = children.filter(
      prefab =>
        !(prefab instanceof EditorMetadataEntity) &&
        prefab instanceof EmptyFacade &&
        prefab.isFolder,
    );
    const nonFolders = children.filter(
      prefab =>
        !(prefab instanceof EditorMetadataEntity) &&
        !(prefab instanceof EmptyFacade && prefab.isFolder),
    );

    for (const prefab of folders) {
      this.renderPrefabCard(this.inspectorUI, prefab);
    }

    for (const prefab of nonFolders) {
      this.renderPrefabCard(this.inspectorUI, prefab);
    }
  }

  private addContextMenu(ui: InspectorUI) {
    this.#content.addEventListener("contextmenu", (event: MouseEvent) => {
      if (
        event.target instanceof HTMLElement &&
        (event.target.closest(".prefab-card") ||
          event.target.closest(".prefab-back-button") ||
          event.target.closest(".prefab-folder"))
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const targetParent = this.#currentFolder ?? this.prefabsRoot;

      const entityMenu: ContextMenuItem = createEntityMenu("New Prefab", type => {
        const newEntity = targetParent.spawn({
          type: type,
          name: type.name,
        });

        UndoRedoManager._.push({
          t: "create-entity",
          parentRef: targetParent.ref,
          def: newEntity.getDefinition(),
        });

        ui.selectedEntity.entities = [newEntity];
      });

      const folderMenuItem: ContextMenuItem = [
        "New Folder",
        () => {
          const newFolder = targetParent.spawn({
            type: EmptyFacade,
            name: "New Folder",
          });

          newFolder.isFolder = true;

          UndoRedoManager._.push({
            t: "create-entity",
            parentRef: targetParent.ref,
            def: newFolder.getDefinition(),
          });

          ui.selectedEntity.entities = [newFolder];
        },
        false,
        undefined,
        0,
        1,
      ];

      const contextMenuItems: ContextMenuItem[] = [folderMenuItem, entityMenu];

      ui.contextMenu.drawContextMenu(event.clientX, event.clientY, contextMenuItems);
    });
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

  #createDragPreview(worldPos: Vector2) {
    if (!this.currentDragSource) return;

    this.#cleanupDragPreview();

    this.#dragPreviewParent = this.game.local.spawn({
      type: EmptyFacade,
      name: ".dragPreview",
    });

    for (const sourceEntity of this.currentDragSource.entities) {
      const preview = sourceEntity.cloneInto(this.#dragPreviewParent, {
        transform: { position: worldPos },
        enabled: true,
      });

      this.#setEntityAlpha(preview, 0.5);

      this.#dragPreviewEntities.push(preview);
    }
  }

  #setEntityAlpha(entity: Entity, alpha: number) {
    if (entity instanceof PixiEntity && entity.container) {
      entity.container.alpha = alpha;
    }

    for (const child of entity.children.values()) {
      this.#setEntityAlpha(child, alpha);
    }
  }

  #updateDragPreviewPosition(worldPos: Vector2) {
    if (this.#dragPreviewEntities.length === 0) return;

    for (const preview of this.#dragPreviewEntities) {
      preview.globalTransform.position = worldPos;
    }
  }

  #cleanupDragPreview() {
    for (const preview of this.#dragPreviewEntities) {
      preview.destroy();
    }
    this.#dragPreviewEntities = [];

    if (this.#dragPreviewParent) {
      this.#dragPreviewParent.destroy();
      this.#dragPreviewParent = undefined;
    }
  }
}
