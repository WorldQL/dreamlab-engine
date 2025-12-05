import {
  ClientGame,
  Entity,
  EntityChildSpawned,
  EntityConstructor,
  EntityDescendantSpawned,
  EntityDestroyed,
  EntityEnableChanged,
  EntityRenamed,
  EntityReparented,
  PhysicsDebug,
  Root,
  Value,
  Vector2,
} from "@dreamlab/engine";
import { element as elem, element } from "@dreamlab/ui";
import { EmptyFacade } from "../../common/facades/empty.ts";
import { EditorFacadeTilemap } from "../../common/facades/tilemap.ts";
import {
  EditorMetadataEntity,
  EditorRootFacadeEntity,
  Facades,
  PrefabRootFacade,
} from "../../common/mod.ts";
import { ChevronDown, Ellipsis, icon, Lock } from "../_icons.tsx";
import { entityNameSort } from "../entity-sort.ts";
import { UndoRedoManager, type UndoRedoOperation } from "../undo-redo.ts";
import { createEntityMenu } from "../util/entity-types.ts";
import { getEntitiesEnabledState } from "../util/entity-utils.ts";
import { getModifierKeySymbol } from "../util/platform.ts";
import { ContextMenuItem } from "./context-menu.ts";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";
import {
  copyEntitiesToClipboard,
  isRoot,
  pasteEntitiesFromClipboard,
} from "./keyboard-shortcuts.ts";

function eventTargetsEntry(event: Event, entryElement: HTMLElement) {
  if (!(event.target instanceof HTMLElement)) return false;
  return event.target.closest("details[data-entity]") === entryElement;
}

const chevronDownIcon = icon(ChevronDown);

export class SceneGraph implements InspectorUIWidget {
  #title = document.createTextNode("Scene Graph");
  #section: HTMLElement = elem(
    "section",
    {
      id: "scene-graph",
    },
    [
      elem(
        "h1",
        {
          title: "Browse the hierarchy and right-click an entity for actions",
          ariaLabel: "Browse the hierarchy and right-click an entity for actions",
          style: { display: "flex", alignItems: "center" },
        },
        [
          this.#title,
          elem(
            "button",
            {
              id: "scene-graph-menu-button",
              className: "menu-button",
              type: "button",
              title: "Scene actions",
            },
            [icon(Ellipsis)],
          ),
        ],
      ),
    ],
  );

  entryElementMap = new Map<string, HTMLElement>();
  currentDragSource: { entities: Entity[]; entries: HTMLElement[] } | undefined;
  #shownEntities: Set<string> = new Set();
  lastSelectedEntry: HTMLElement | null = null; // Keep track of the last selected entry

  constructor(private game: ClientGame) {
    const savedState = sessionStorage.getItem(`${this.game.worldId}/editor/scene-graph/opened`);
    if (savedState) {
      this.#shownEntities = new Set(JSON.parse(savedState));
    }
  }

  #saveOpenEntities() {
    sessionStorage.setItem(
      `${this.game.worldId}/editor/scene-graph/opened`,
      JSON.stringify([...this.#shownEntities]),
    );
  }

  setup(ui: InspectorUI): void {
    const treeRoot = elem("div", { id: "scene-graph-tree" });
    this.#section.append(treeRoot);

    const savedBackground = sessionStorage.getItem("editor-viewport-background");
    if (savedBackground === "white") {
      const viewport = document.getElementById("viewport");
      if (viewport) {
        viewport.classList.add("white-background");
      }
    }

    const headerBtn = this.#section.querySelector<HTMLButtonElement>(
      "#scene-graph-menu-button",
    );
    headerBtn?.addEventListener("click", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const rect = headerBtn.getBoundingClientRect();
      const world = ui.editMode ? this.game.world._.EditEntities._.world : this.game.world;

      ui.contextMenu.drawContextMenu(rect.left, rect.bottom, [
        createEntityMenu("New Entity", type => {
          const typeToSpawn = ui.editMode ? Facades.lookupFacadeEntityType(type) : type;
          const newEntity = world.spawn({
            type: typeToSpawn,
            name: type.name,
            transform: {
              position: this.game.local._.Camera.globalTransform.position,
            },
          });

          UndoRedoManager._.push({
            t: "create-entity",
            parentRef: world.ref,
            def: newEntity.getDefinition(),
          });

          ui.selectedEntity.entities = [newEntity];

          const newEntryElement = this.entryElementMap.get(newEntity.ref);
          if (newEntryElement) this.triggerRename(newEntity, newEntryElement);
        }),
      ]);
    });

    const onF2KeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== "F2" && ev.key !== "Enter") return;
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement && (document.activeElement as HTMLElement).isContentEditable)
      )
        return;

      ev.preventDefault();
      const [ent] = ui.selectedEntity.entities;
      if (!ent) return;
      if (ent instanceof EditorRootFacadeEntity || ent instanceof Root) return;

      const entryEl = this.entryElementMap.get(ent.ref);
      if (entryEl) this.triggerRename(ent, entryEl);
    };

    document.addEventListener("keydown", onF2KeyDown, { capture: true });

    this.handleEntitySelection(ui, treeRoot);

    if (ui.editMode) {
      this.renderEntry(ui, treeRoot, this.game.world._.EditEntities._.world);
      this.renderEntry(ui, treeRoot, this.game.world._.EditEntities._.local);
      this.renderEntry(ui, treeRoot, this.game.world._.EditEntities._.server);
      this.renderEntry(ui, treeRoot, this.game.world._.EditEntities._.prefabs);
    } else {
      const totalEntityCount = (): number =>
        this.game.world.entities.size +
        this.game.local.entities.size +
        this.game.prefabs.entities.size;

      const MAX_ENTITIES = 2500;
      if (totalEntityCount() <= MAX_ENTITIES) {
        this.renderEntry(ui, treeRoot, this.game.world);
        this.renderEntry(ui, treeRoot, this.game.local);
        this.renderEntry(ui, treeRoot, this.game.prefabs);
      }

      let tripped: boolean = false;
      const checkTotalEntities = () => {
        if (tripped) return;
        const count = totalEntityCount();
        if (count <= MAX_ENTITIES) return;
        tripped = true;

        const tooMany = elem("div", { id: "too-many-total-entities" }, [
          "Scene contains too many entities, they have been hidden for performance.",
        ]);

        treeRoot.innerHTML = "";
        treeRoot.append(tooMany);
        this.#title.textContent = "⚠️ " + this.#title.textContent;
      };

      this.game.world.on(EntityDescendantSpawned, checkTotalEntities);
      this.game.local.on(EntityDescendantSpawned, checkTotalEntities);
      this.game.prefabs.on(EntityDescendantSpawned, checkTotalEntities);

      checkTotalEntities();
    }

    const world = ui.editMode ? this.game.world._.EditEntities._.world : this.game.world;

    this.#section.addEventListener("contextmenu", event => {
      // dont show context menu if entity rendering is disabled
      if (treeRoot.matches(":scope:has(#too-many-total-entities)")) return;

      event.preventDefault();
      event.stopPropagation();

      ui.contextMenu.drawContextMenu(event.clientX, event.clientY, [
        createEntityMenu("New Entity", type => {
          const typeToSpawn = ui.editMode ? Facades.lookupFacadeEntityType(type) : type;
          const newEntity = world.spawn({
            type: typeToSpawn,
            name: type.name,
            transform: {
              position: this.game.local._.Camera.globalTransform.position,
            },
          });

          UndoRedoManager._.push({
            t: "create-entity",
            parentRef: world.ref,
            def: newEntity.getDefinition(),
          });

          ui.selectedEntity.entities = [newEntity];

          const newEntryElement = this.entryElementMap.get(newEntity.ref);
          if (newEntryElement) this.triggerRename(newEntity, newEntryElement);
        }),
      ]);
    });
    this.game.renderer.app.canvas.addEventListener("contextmenu", event => {
      if (!this.game.isEditMode) return;
      event.preventDefault();
      event.stopPropagation();
      const posAtRightClick = this.game.inputs.cursor.world;
      let target = world;
      if (ui.selectedEntity.entities.length === 1) {
        target = ui.selectedEntity.entities[0];
      }

      // ignore tilemaps
      // breaks right-click to remove tile
      if (target instanceof EditorFacadeTilemap) return;

      const modifierKey = getModifierKeySymbol();
      const contextMenuItems: ContextMenuItem[] = [];

      contextMenuItems.push(
        createEntityMenu(`New Entity @${target.name}`, type => {
          if (!posAtRightClick) return;
          const typeToSpawn = ui.editMode ? Facades.lookupFacadeEntityType(type) : type;
          const newEntity = target.spawn({
            type: typeToSpawn,
            name: type.name,
            // transform: {
            //   position: posAtRightClick,
            // },
            // TODO: Add ability to set globaltransform on entity.
          });
          newEntity.globalTransform.position = posAtRightClick;

          UndoRedoManager._.push({
            t: "create-entity",
            parentRef: world.ref,
            def: newEntity.getDefinition(),
          });

          ui.selectedEntity.entities = [newEntity];

          const newEntryElement = this.entryElementMap.get(newEntity.ref);
          if (newEntryElement) this.triggerRename(newEntity, newEntryElement);
        }),
      );

      contextMenuItems.push([
        "Paste",
        () => {
          pasteEntitiesFromClipboard(this.game, ui.selectedEntity);
        },
        false,
        `${modifierKey}+V`,
      ]);

      const viewport = document.getElementById("viewport");
      const hasWhiteBackground = viewport?.classList.contains("white-background");
      contextMenuItems.push([
        "Toggle Background Color",
        () => {
          const viewport = document.getElementById("viewport");
          if (viewport) {
            if (hasWhiteBackground) {
              viewport.classList.remove("white-background");
              sessionStorage.setItem("editor-viewport-background", "black");
            } else {
              viewport.classList.add("white-background");
              sessionStorage.setItem("editor-viewport-background", "white");
            }
          }
        },
        false,
        undefined,
      ]);

      ui.contextMenu.drawContextMenu(event.clientX, event.clientY, contextMenuItems);
    });
  }

  show(uiRoot: HTMLElement): void {
    const left = uiRoot.querySelector("#left-sidebar")!;
    left.prepend(this.#section);
  }

  hide(): void {
    this.#section.remove();
  }

  sortEntries(entity: Entity, parent: HTMLElement) {
    // skip sorting if many children
    if (entity.children.size > 500) return;

    const entries = Array.from(parent.querySelectorAll(":scope > details[data-entity]")).map(
      entry => {
        const entity = this.game.entities.lookupByRef(
          (entry as HTMLDetailsElement).dataset.entity!,
        );
        if (entity === undefined) throw new Error("how, dog");
        return [entry, entity] as const;
      },
    );

    entries.sort(([, a], [, b]) => entityNameSort(a, b));

    for (const [entry, _] of entries) {
      parent.removeChild(entry);
      parent.append(entry);
    }
  }

  renderEntry(ui: InspectorUI, parent: HTMLElement, entity: Entity, depth: number = 0) {
    if (entity instanceof EditorMetadataEntity) return;
    if (entity instanceof PhysicsDebug) return;
    const currentEntityRef = entity.ref;

    if (this.entryElementMap.has(currentEntityRef)) return;

    const toggle = elem("div", { className: "arrow" }, [
      chevronDownIcon.cloneNode(true) as Element,
    ]);
    const entityIcon =
      !this.game.isEditMode &&
      (entity.id === "prefabs" || entity.id === "world" || entity.id === "local") &&
      entity.root.icon
        ? entity.root.icon
        : (entity.icon ?? (entity.constructor as typeof Entity).icon);

    const lockBadge = elem(
      "span",
      { className: "lock-badge", title: "Locked", style: { display: "none" } },
      [icon(Lock)],
    );

    const summary = elem("summary", {}, [
      toggle,
      elem("a", {}, [
        elem("span", { className: "icon emoji" }, [entityIcon]),
        " ",
        elem("span", { className: "name" }, [elem("span", {}, [entity.name])]),
        lockBadge,
      ]),
    ]);
    const entryElement = elem(
      "details",
      {
        open: this.#shownEntities.has(currentEntityRef) || entity.children.size === 0,
      },
      [summary],
    ) as HTMLDetailsElement;

    entryElement.style.setProperty("--depth", depth.toString());

    entryElement.setAttribute("data-enabled", entity.enabled ? "true" : "false");
    entryElement.dataset.entity = currentEntityRef;
    if (entity.clonedFromRef) entryElement.dataset.prefabInstance = entity.clonedFromRef;
    this.entryElementMap.set(currentEntityRef, entryElement);

    entity.on(EntityEnableChanged, signal => {
      entryElement.setAttribute("data-enabled", signal.enabled ? "true" : "false");
    });

    const metadata = entity.children.get("__EditorMetadata")?.cast(EditorMetadataEntity);
    if (metadata) {
      const lockedValue = metadata.values.get("locked") as Value<boolean>;
      const updateLocked = () => {
        if (lockedValue.value) {
          entryElement.setAttribute("data-locked", "");
          lockBadge.style.display = "inline-flex";
        } else {
          entryElement.removeAttribute("data-locked");
          lockBadge.style.display = "none";
        }
      };
      lockedValue.onChanged(updateLocked);
      updateLocked();
    }

    const clonedFromRef = entity.values.get("clonedFromRef");
    clonedFromRef?.onChanged(() => {
      if (entity.clonedFromRef) entryElement.dataset.prefabInstance = entity.clonedFromRef;
      else delete entryElement.dataset.prefabInstance;
    });

    toggle.addEventListener("click", () => {
      entryElement.open = !entryElement.open;

      if (entryElement.open) this.#shownEntities.add(currentEntityRef);
      else this.#shownEntities.delete(currentEntityRef);

      this.#saveOpenEntities();
    });

    entryElement.addEventListener("dblclick", event => {
      if (!eventTargetsEntry(event, entryElement)) return;
      if (entryElement.querySelector(":scope > summary input")) return;
      entryElement.open = !entryElement.open;

      if (entryElement.open) this.#shownEntities.add(currentEntityRef);
      else this.#shownEntities.delete(currentEntityRef);

      this.#saveOpenEntities();
    });

    summary.addEventListener("click", ev => {
      ev.preventDefault();
    });

    // TODO: maybe some 'click to show more' thing would work well here
    const tooManyEntities = element("div", { className: "too-many-entities" }, [
      `[${entity.children.size} entities not shown]`,
    ]);

    let needsSorting: (() => void) | undefined;

    entity.on(EntityChildSpawned, event => {
      const newEntity = event.child;
      if (entity.children.size > 2500) {
        tooManyEntities.textContent = `[${entity.children.size} entities not shown]`;
        entryElement.innerHTML = "";
        entryElement.append(summary);
        entryElement.append(tooManyEntities);
      } else {
        this.renderEntry(ui, entryElement, newEntity, depth + 1);
        if (!needsSorting) {
          needsSorting = () => {
            this.sortEntries(entity, entryElement);
            needsSorting = undefined;
          };
          queueMicrotask(needsSorting);
        }
      }
    });

    entity.on(EntityReparented, () => {
      const parent = entity.parent;
      if (parent === undefined) return;
      const parentElement = this.entryElementMap.get(parent.ref);
      if (parentElement === undefined) return;
      parentElement.append(entryElement);

      this.updateDepth(entryElement);
      this.sortEntries(parent, parentElement);
    });

    entity.on(EntityDestroyed, () => {
      entryElement.remove();
      this.entryElementMap.delete(currentEntityRef);
    });

    const updateIcon = () => {
      const iconElement = entryElement.querySelector(":scope > summary .icon");
      if (iconElement) {
        const newIcon =
          !this.game.isEditMode &&
          (entity.id === "prefabs" || entity.id === "world" || entity.id === "local") &&
          entity.root.icon
            ? entity.root.icon
            : (entity.icon ?? (entity.constructor as typeof Entity).icon);
        iconElement.textContent = newIcon;
      }
    };

    entity.on(EntityRenamed, () => {
      const name = entryElement.querySelector(":scope > summary .name")!;
      name.textContent = entity.name;

      const parent = entity.parent;
      if (parent === undefined) return;
      const parentElement = this.entryElementMap.get(parent.ref);
      if (parentElement === undefined) return;
      this.sortEntries(parent, parentElement);
    });

    if (entity instanceof EmptyFacade) {
      const isFolderValue = entity.values.get("isFolder");
      isFolderValue?.onChanged(() => {
        updateIcon();
      });
    }

    this.handleEntryDragAndDrop(ui, entity, entryElement);
    this.handleEntryContextMenu(ui, entity, entryElement, summary);

    parent.append(entryElement);
    if (entity.children.size > 2500) {
      entryElement.append(tooManyEntities);
    } else {
      const children = [...entity.children.values()];
      children.sort(entityNameSort);
      for (const child of children) {
        this.renderEntry(ui, entryElement, child, depth + 1);
      }
      this.sortEntries(entity, entryElement);
    }
  }

  triggerRename(entity: Entity, entryElement: HTMLElement) {
    const previousName = entity.name;
    const name = entryElement.querySelector(":scope > summary .name")! as HTMLElement;

    name.style.display = "none";
    const input = elem("input", { type: "text", value: entity.name });
    const reset = () => {
      name.style.display = "inherit";
      input.remove();
    };
    name.parentElement!.append(input);
    input.focus();
    input.setSelectionRange(0, input.value.length);

    input.addEventListener("keypress", event => {
      if (event.key === "Enter") {
        input.blur();
      }
    });
    input.addEventListener("blur", () => {
      if (input.value === "" || input.value === entity.name) {
        reset();
        return;
      }

      entity.name = input.value;
      UndoRedoManager._.push({
        t: "rename-entity",
        entityRef: entity.ref,
        previous: previousName,
        name: entity.name,
      });

      reset();

      this.sortEntries(entity, entryElement);
      this.scrollToEntity(entryElement);
    });
  }

  handleEntryDragAndDrop(ui: InspectorUI, entity: Entity, entryElement: HTMLElement) {
    entryElement.addEventListener("dragover", event => {
      if (!eventTargetsEntry(event, entryElement)) return;

      if (!this.currentDragSource) return;
      const targetEntity = entity;
      const sourceEntities = this.currentDragSource.entities;

      // Prevent dropping onto self or descendants
      if (
        sourceEntities.includes(targetEntity) ||
        sourceEntities.some(se => this.isDescendant(targetEntity, se))
      ) {
        return;
      }
      event.preventDefault();

      entryElement.classList.add("drag-target");
    });

    entryElement.addEventListener("dragleave", () => {
      entryElement.classList.remove("drag-target");
    });

    entryElement.addEventListener("dragend", () => {
      entryElement.classList.remove("drag-target");
    });

    entryElement.addEventListener("drop", event => {
      if (!eventTargetsEntry(event, entryElement)) return;

      if (!this.currentDragSource) return;
      const targetEntity = entity;
      const sourceEntities = this.currentDragSource.entities;

      // Prevent dropping onto self or descendants
      if (
        sourceEntities.includes(targetEntity) ||
        sourceEntities.some(se => this.isDescendant(targetEntity, se))
      ) {
        return;
      }

      // Determine top-level entities (those without a selected parent)
      const topLevelEntities = sourceEntities.filter(
        entity => !sourceEntities.includes(entity.parent!),
      );

      const undoableOperations: (UndoRedoOperation & { t: "compound" })["ops"] = [];

      if (event.getModifierState("Control")) {
        // Clone top-level entities into target
        for (const sourceEntity of topLevelEntities) {
          const newEntity = sourceEntity.cloneInto(targetEntity);
          undoableOperations.push({
            t: "create-entity",
            def: newEntity.getDefinition(),
            parentRef: targetEntity.ref,
          });
        }
      } else {
        // Move top-level entities under target
        for (const sourceEntity of topLevelEntities) {
          const prevParentRef = sourceEntity.parent?.ref;
          sourceEntity.parent = targetEntity;
          if (prevParentRef) {
            undoableOperations.push({
              t: "move-entity",
              entityRef: sourceEntity.ref,
              prevParentRef,
              parentRef: targetEntity.ref,
            });
          }
        }
      }

      if (undoableOperations.length > 0) {
        UndoRedoManager._.push({ t: "compound", ops: undoableOperations });
      }
    });

    if (entity.parent?.id === "world/EditEntities") return;

    entryElement.draggable = true;

    entryElement.addEventListener("dragstart", event => {
      if (!eventTargetsEntry(event, entryElement)) return;

      const selectedEntities = ui.selectedEntity.entities;
      const selectedEntries = selectedEntities
        .map(e => this.entryElementMap.get(e.ref))
        .filter(e => e !== undefined) as HTMLElement[];

      if (selectedEntities.includes(entity)) {
        // Dragging multiple entities
        this.currentDragSource = {
          entities: selectedEntities as Entity[],
          entries: selectedEntries,
        };
        for (const entry of selectedEntries) {
          entry.dataset.dragging = "";
        }
      } else {
        // Dragging single entity
        this.currentDragSource = {
          entities: [entity],
          entries: [entryElement],
        };
        entryElement.dataset.dragging = "";
      }
    });

    entryElement.addEventListener("dragend", () => {
      if (this.currentDragSource) {
        for (const entry of this.currentDragSource.entries) {
          delete entry.dataset.dragging;
        }
      }
      this.currentDragSource = undefined;
    });
  }

  handleEntryContextMenu(
    ui: InspectorUI,
    entity: Entity,
    entryElement: HTMLDetailsElement,
    summary: HTMLElement,
  ) {
    summary.addEventListener("contextmenu", event => {
      event.preventDefault();
      event.stopPropagation();

      const lockedByEntity = ui.editMode ? EditorMetadataEntity.getLockedBy(entity) : undefined;

      const isEntitySelected = ui.selectedEntity.entities.includes(entity);
      if (!isEntitySelected && !lockedByEntity) {
        ui.selectedEntity.entities = [entity];
      }

      const contextMenuItems: ContextMenuItem[] = [];
      const modifierKey = getModifierKeySymbol();
      const enabledState = getEntitiesEnabledState(ui.selectedEntity.entities);

      if (ui.selectedEntity.entities.length > 1) {
        contextMenuItems.push(
          [
            "Copy",
            () => {
              ui.selectedEntity.entities = [...ui.selectedEntity.entities];
              copyEntitiesToClipboard(ui.selectedEntity);
            },
            false,
            `${modifierKey}+C`,
            10,
            1,
          ],
          [
            "Duplicate",
            () => {
              ui.selectedEntity.entities = [...ui.selectedEntity.entities];
              copyEntitiesToClipboard(ui.selectedEntity).then(() => {
                pasteEntitiesFromClipboard(this.game, ui.selectedEntity);
              });
            },
            false,
            `${modifierKey}+D`,
            10,
            2,
          ],
          [
            "Cut",
            () => {
              ui.selectedEntity.entities = [...ui.selectedEntity.entities];
              copyEntitiesToClipboard(ui.selectedEntity);

              UndoRedoManager._.push({
                t: "compound",
                ops: ui.selectedEntity.entities
                  .filter(it => !it.protected)
                  .map(e => ({
                    t: "destroy-entity",
                    def: e.getDefinition(),
                    parentRef: e.parent?.ref!,
                  })),
              });
              for (const entity of ui.selectedEntity.entities) entity.destroy();
              ui.selectedEntity.entities = [];
            },
            false,
            `${modifierKey}+X`,
            10,
            3,
          ],
          [
            "Delete",
            () => {
              const toDelete = ui.selectedEntity.entities.filter(e => !isRoot(e));

              const undoOps = toDelete.map(entity => ({
                t: "destroy-entity" as const,
                def: entity.getDefinition(),
                parentRef: entity.parent?.ref!,
              }));

              toDelete.forEach(entity => entity.destroy());
              if (undoOps.length) {
                UndoRedoManager._.push({ t: "compound", ops: undoOps });
              }

              ui.selectedEntity.entities = ui.selectedEntity.entities.filter(isRoot);
            },
            false,
            "Backspace",
            50,
            1,
          ],
        );

        if (ui.editMode && !entity.protected) {
          contextMenuItems.push([
            enabledState === "allEnabled"
              ? "Disable"
              : enabledState === "allDisabled"
                ? "Enable"
                : "Toggle Enabled",
            () => {
              for (const e of ui.selectedEntity.entities) {
                e.enabled = !(enabledState === "allEnabled");
              }
            },
            false,
            `${modifierKey}+E`,
            10,
            1,
          ]);

          const selectedRootPrefixes = new Set<string>();
          for (const e of ui.selectedEntity.entities) {
            const idParts = e.id.split("/");
            const rootPrefix = ui.editMode && idParts.length >= 3 ? idParts[2] : idParts[0];
            if (rootPrefix) selectedRootPrefixes.add(rootPrefix);
          }

          if (selectedRootPrefixes.size === 1) {
            const availableRoots: { name: string; entity: Entity }[] = [];

            if (ui.editMode) {
              const roots = [
                {
                  name: "World",
                  entity: this.game.world._.EditEntities._.world,
                  prefix: "world",
                },
                {
                  name: "Local",
                  entity: this.game.world._.EditEntities._.local,
                  prefix: "local",
                },
                {
                  name: "Server",
                  entity: this.game.world._.EditEntities._.server,
                  prefix: "server",
                },
                {
                  name: "Prefabs",
                  entity: this.game.world._.EditEntities._.prefabs,
                  prefix: "prefabs",
                },
              ];
              availableRoots.push(
                ...roots
                  .filter(root => !selectedRootPrefixes.has(root.prefix))
                  .map(({ name, entity }) => ({ name, entity })),
              );
            } else {
              const roots = [
                { name: "World", entity: this.game.world, prefix: "world" },
                { name: "Local", entity: this.game.local, prefix: "local" },
                { name: "Prefabs", entity: this.game.prefabs, prefix: "prefabs" },
              ];
              availableRoots.push(
                ...roots
                  .filter(root => !selectedRootPrefixes.has(root.prefix))
                  .map(({ name, entity }) => ({ name, entity })),
              );
            }

            if (availableRoots.length > 0) {
              const reparentMenuItems: ContextMenuItem[] = availableRoots.map(root => [
                root.name,
                () => {
                  const undoableOperations: (UndoRedoOperation & { t: "compound" })[`ops`] = [];

                  const topLevelEntities = ui.selectedEntity.entities.filter(
                    e => !ui.selectedEntity.entities.includes(e.parent!),
                  );

                  for (const selectedEntity of topLevelEntities) {
                    const prevParentRef = selectedEntity.parent?.ref;
                    selectedEntity.parent = root.entity;
                    if (prevParentRef) {
                      undoableOperations.push({
                        t: "move-entity",
                        entityRef: selectedEntity.ref,
                        prevParentRef,
                        parentRef: root.entity.ref,
                      });
                    }
                  }

                  if (undoableOperations.length > 0) {
                    UndoRedoManager._.push({ t: "compound", ops: undoableOperations });
                  }
                },
              ]);

              const reparentMenuItem: ContextMenuItem = ["Reparent", reparentMenuItems];
              (reparentMenuItem as unknown[]).push(false, undefined, 40, 1);
              contextMenuItems.push(reparentMenuItem);
            }
          }

          if (lockedByEntity) {
            contextMenuItems.push([
              "Unlock",
              () => {
                const undoOps: (UndoRedoOperation & { t: "compound" })["ops"] = [];
                const lockRoots = new Set<Entity>();
                ui.selectedEntity.entities.forEach(e => {
                  const lockedBy = EditorMetadataEntity.getLockedBy(e);
                  if (lockedBy) lockRoots.add(lockedBy);
                });

                for (const lockRoot of lockRoots) {
                  const metadata = EditorMetadataEntity.getInstanceFor(lockRoot);
                  const prevLocked = metadata.locked;
                  metadata.locked = false;
                  undoOps.push({
                    t: "modify-entity-locked",
                    entityRef: lockRoot.ref,
                    locked: false,
                    previous: prevLocked,
                  } as const);
                }
                UndoRedoManager._.push({ t: "compound", ops: undoOps });
              },
              false,
              `${modifierKey}+Shift+L`,
              30,
              1,
            ]);
          } else {
            contextMenuItems.push([
              "Lock",
              () => {
                const metadata = EditorMetadataEntity.getInstanceFor(entity);
                const prevLocked = metadata.locked;
                metadata.locked = true;
                UndoRedoManager._.push({
                  t: "modify-entity-locked",
                  entityRef: entity.ref,
                  locked: true,
                  previous: prevLocked,
                });
              },
              false,
              `${modifierKey}+Shift+L`,
              30,
              1,
            ]);
          }
        }
      } else {
        contextMenuItems.push([
          "Focus",
          () => this.game.local._.Camera.pos.assign(entity.pos),
          false,
          undefined,
          0,
          1,
        ]);

        if (isRoot(entity)) {
          contextMenuItems.push([
            "Copy Children",
            () => {
              const children = [...entity.children.values()];
              if (children.length > 0) {
                ui.selectedEntity.entities = children;
                copyEntitiesToClipboard(ui.selectedEntity);
                ui.selectedEntity.entities = [entity];
              }
            },
            false,
            undefined,
            0,
            2,
          ]);

          const prefabRoot = ui.editMode
            ? this.game.world._.EditEntities._.prefabs
            : this.game.prefabs;
          if (entity === prefabRoot) {
            contextMenuItems.push([
              ui.prefabAutoHide ? "Disable Auto-Hide" : "Enable Auto-Hide",
              () => {
                ui.prefabAutoHide = !ui.prefabAutoHide;
                sessionStorage.setItem(
                  `${this.game.worldId}/editor/prefab-auto-hide`,
                  ui.prefabAutoHide.toString(),
                );

                if (ui.editMode) {
                  const prefabRootEntity = this.game.world._.EditEntities._.prefabs;
                  if (ui.prefabAutoHide) {
                    const hasPrefabSelected = ui.selectedEntity.entities.some(
                      it =>
                        it === prefabRootEntity || it.id.startsWith(prefabRootEntity.id + "/"),
                    );
                    (prefabRootEntity as PrefabRootFacade).localHidden = !hasPrefabSelected;
                  } else {
                    (prefabRootEntity as PrefabRootFacade).localHidden = false;
                  }
                }
              },
              false,
              undefined,
              10,
              1,
            ]);
          }
        }

        if (!lockedByEntity) {
          contextMenuItems.push(
            createEntityMenu("New Entity", type => {
              let pos = new Vector2(0, 0);
              if (entity instanceof EditorRootFacadeEntity || entity instanceof Root) {
                pos = this.game.local._.Camera.globalTransform.position;
              }
              const typeToSpawn = ui.editMode ? Facades.lookupFacadeEntityType(type) : type;
              const newEntity = entity.spawn({
                type: typeToSpawn,
                name: type.name,
                transform: { position: pos },
              });

              UndoRedoManager._.push({
                t: "create-entity",
                parentRef: entity.ref,
                def: newEntity.getDefinition(),
              });

              ui.selectedEntity.entities = [newEntity];

              const newEntryElement = this.entryElementMap.get(newEntity.ref);
              if (newEntryElement) this.triggerRename(newEntity, newEntryElement);
            }),
          );
        }

        if (!entity.protected && !lockedByEntity) {
          contextMenuItems.push(
            [
              "Rename",
              () => {
                this.triggerRename(entity, entryElement);
              },
              false,
              "F2",
              1,
              1,
            ],
            [
              "Copy",
              () => {
                ui.selectedEntity.entities = [entity];
                copyEntitiesToClipboard(ui.selectedEntity);
              },
              false,
              `${modifierKey}+C`,
              1,
              2,
            ],
            [
              "Duplicate",
              () => {
                ui.selectedEntity.entities = [entity];
                copyEntitiesToClipboard(ui.selectedEntity).then(() => {
                  pasteEntitiesFromClipboard(this.game, ui.selectedEntity);
                });
              },
              false,
              `${modifierKey}+D`,
              1,
              3,
            ],
            [
              "Paste",
              () => {
                pasteEntitiesFromClipboard(this.game, ui.selectedEntity);
              },
              false,
              `${modifierKey}+V`,
              1,
              4,
            ],
          );
        }

        const bottomItems: ContextMenuItem[] = [];
        if (!entity.protected && ui.editMode) {
          if (lockedByEntity) {
            bottomItems.push([
              "Unlock",
              () => {
                const metadata = EditorMetadataEntity.getInstanceFor(lockedByEntity);
                const prevLocked = metadata.locked;
                metadata.locked = false;
                UndoRedoManager._.push({
                  t: "modify-entity-locked",
                  entityRef: lockedByEntity.ref,
                  locked: false,
                  previous: prevLocked,
                });
              },
              false,
              `${modifierKey}+Shift+L`,
              50,
              1,
            ]);
          } else {
            bottomItems.push([
              "Lock",
              () => {
                const metadata = EditorMetadataEntity.getInstanceFor(entity);
                const prevLocked = metadata.locked;
                metadata.locked = true;
                UndoRedoManager._.push({
                  t: "modify-entity-locked",
                  entityRef: entity.ref,
                  locked: true,
                  previous: prevLocked,
                });
              },
              false,
              `${modifierKey}+Shift+L`,
              50,
              1,
            ]);
          }
        }
        bottomItems.push([
          enabledState === "allEnabled"
            ? "Disable"
            : enabledState === "allDisabled"
              ? "Enable"
              : "Toggle Enabled",
          () => {
            for (const e of ui.selectedEntity.entities) {
              if (isRoot(e)) {
                for (const child of e.children.values()) {
                  child.enabled = !(enabledState === "allEnabled");
                }
              } else {
                e.enabled = !(enabledState === "allEnabled");
              }
            }
          },
          false,
          `${modifierKey}+E`,
          50,
          2,
        ]);
        if (!entity.protected && !lockedByEntity) {
          const replaceMenuItem = createEntityMenu("Replace", type => {
            if (type === entity.constructor) return;
            this.replaceEntityType(ui, entity, type);
          });
          replaceMenuItem.push(false, undefined, 40, 1);
          bottomItems.push(replaceMenuItem);

          const idParts = entity.id.split("/");
          const entityRootPrefix = ui.editMode && idParts.length >= 3 ? idParts[2] : idParts[0];

          const availableRoots: { name: string; entity: Entity }[] = [];

          if (ui.editMode) {
            const roots = [
              {
                name: "World",
                entity: this.game.world._.EditEntities._.world,
                prefix: "world",
              },
              {
                name: "Local",
                entity: this.game.world._.EditEntities._.local,
                prefix: "local",
              },
              {
                name: "Server",
                entity: this.game.world._.EditEntities._.server,
                prefix: "server",
              },
              {
                name: "Prefabs",
                entity: this.game.world._.EditEntities._.prefabs,
                prefix: "prefabs",
              },
            ];
            availableRoots.push(
              ...roots
                .filter(root => entityRootPrefix !== root.prefix)
                .map(({ name, entity }) => ({ name, entity })),
            );
          } else {
            const roots = [
              { name: "World", entity: this.game.world, prefix: "world" },
              { name: "Local", entity: this.game.local, prefix: "local" },
              { name: "Prefabs", entity: this.game.prefabs, prefix: "prefabs" },
            ];
            availableRoots.push(
              ...roots
                .filter(root => entityRootPrefix !== root.prefix)
                .map(({ name, entity }) => ({ name, entity })),
            );
          }

          if (availableRoots.length > 0) {
            const reparentMenuItems: ContextMenuItem[] = availableRoots.map(root => [
              root.name,
              () => {
                const prevParentRef = entity.parent?.ref;
                entity.parent = root.entity;
                if (prevParentRef) {
                  UndoRedoManager._.push({
                    t: "move-entity",
                    entityRef: entity.ref,
                    prevParentRef,
                    parentRef: root.entity.ref,
                  });
                }
              },
            ]);

            const reparentMenuItem: ContextMenuItem = ["Reparent", reparentMenuItems];
            (reparentMenuItem as unknown[]).push(false, undefined, 40, 2);
            bottomItems.push(reparentMenuItem);
          }

          bottomItems.push(
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
                }
                entity.destroy();
              },
              false,
              "Backspace",
              51,
              1,
            ],
            [
              "Cut",
              () => {
                ui.selectedEntity.entities = [entity];
                copyEntitiesToClipboard(ui.selectedEntity);
                UndoRedoManager._.push({
                  t: "destroy-entity",
                  def: entity.getDefinition(),
                  parentRef: entity.parent?.ref!,
                });
                entity.destroy();
              },
              false,
              `${modifierKey}+X`,
              1,
              4,
            ],
          );
        }
        contextMenuItems.push(...bottomItems);
      }

      ui.contextMenu.drawContextMenu(event.clientX, event.clientY, contextMenuItems);
    });
  }

  handleEntitySelection(ui: InspectorUI, treeRoot: HTMLElement) {
    ui.selectedEntity.listen(() => {
      const selectedCount = ui.selectedEntity.entities.length;

      if (selectedCount > 1) {
        treeRoot.dataset.multipleSelection = "";
      } else {
        delete treeRoot.dataset.multipleSelection;
      }

      for (const [entityRef, entry] of this.entryElementMap.entries()) {
        const entity = this.game.entities.lookupByRef(entityRef);
        if (entity && ui.selectedEntity.entities.includes(entity)) {
          entry.classList.add("selected");
          this.openParentNodes(entry);
          if (selectedCount === 1) {
            this.scrollToEntity(entry);
          }
        } else {
          entry.classList.remove("selected");
        }
      }
    });

    treeRoot.addEventListener("click", event => {
      if (!(event.target instanceof Element)) return;

      // Handle shift-click range selection
      const selectMultiple = event.getModifierState("Control");
      const rangeSelect = event.getModifierState("Shift");

      const entryElement = event.target.closest("details[data-entity] > summary")?.parentNode;
      if (!entryElement) {
        if (!selectMultiple && !rangeSelect) ui.selectedEntity.entities = [];
        return;
      }
      const entity = this.game.entities.lookupByRef(
        (entryElement as HTMLDetailsElement).dataset.entity!,
      );
      if (!entity) return;

      if (rangeSelect && this.lastSelectedEntry) {
        const allEntries = Array.from(
          treeRoot.querySelectorAll(
            ":is(#scene-graph-tree, details[open]) > details[data-entity]",
          ),
        ) as HTMLElement[];

        // Perform range selection
        const startIndex = allEntries.indexOf(this.lastSelectedEntry);
        const endIndex = allEntries.indexOf(entryElement as HTMLElement);

        if (startIndex !== -1 && endIndex !== -1) {
          const [from, to] =
            startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
          const entriesInRange = allEntries.slice(from, to + 1);
          const entitiesInRange = entriesInRange
            .map(entry => {
              const entityRef = entry.dataset.entity!;
              return this.game.entities.lookupByRef(entityRef);
            })
            .filter(e => e !== undefined) as Entity[];

          ui.selectedEntity.entities = selectMultiple
            ? Array.from(new Set([...ui.selectedEntity.entities, ...entitiesInRange]))
            : entitiesInRange;
        }
        this.lastSelectedEntry = entryElement as HTMLElement;
      } else if (selectMultiple) {
        if (ui.selectedEntity.entities.includes(entity)) {
          ui.selectedEntity.entities = ui.selectedEntity.entities.filter(e => e !== entity);
        } else {
          ui.selectedEntity.entities = [...ui.selectedEntity.entities, entity];
        }
        this.lastSelectedEntry = entryElement as HTMLElement;
      } else {
        ui.selectedEntity.entities = [entity];
        this.lastSelectedEntry = entryElement as HTMLElement;
      }
    });
  }

  private scrollToEntity(entry: HTMLElement) {
    entry.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  private openParentNodes(entry: HTMLElement) {
    let parent = entry.parentElement;
    while (parent && parent.tagName !== "BODY") {
      if (parent.tagName === "DETAILS") {
        (parent as HTMLDetailsElement).open = true;
      }
      parent = parent.parentElement;
    }
  }

  // Helper method to check if target is a descendant of source
  private isDescendant(target: Entity, source: Entity): boolean {
    let current = target.parent;
    while (current) {
      if (current === source) return true;
      current = current.parent;
    }
    return false;
  }

  private updateDepth(entryElement: HTMLElement) {
    let depth = 0;
    let currentParent: HTMLElement | null = entryElement.parentElement;
    const treeRoot = this.#section.querySelector("#scene-graph-tree");

    while (currentParent && currentParent !== treeRoot) {
      if (currentParent.tagName === "DETAILS") {
        depth++;
      }
      currentParent = currentParent.parentElement;
    }

    entryElement.style.setProperty("--depth", depth.toString());

    const childEntries = Array.from(
      entryElement.querySelectorAll(":scope > details[data-entity]"),
    );
    for (const child of childEntries) {
      this.updateDepth(child as HTMLElement);
    }
  }

  private replaceEntityType(ui: InspectorUI, entity: Entity, newType: EntityConstructor) {
    const parent = entity.parent;
    if (!parent) return;

    const currentDef = entity.getDefinition();
    const children = [...entity.children.values()];

    const typeToSpawn = ui.editMode ? Facades.lookupFacadeEntityType(newType) : newType;
    const newEntity = parent.spawn({
      type: typeToSpawn,
      name: currentDef.name,
      transform: currentDef.transform,
      behaviors: currentDef.behaviors,
      values: currentDef.values,
      enabled: currentDef.enabled,
    });

    for (const child of children) {
      child.parent = newEntity;
    }

    // TODO: add undo/redo support

    entity.destroy();
    ui.selectedEntity.entities = [newEntity];

    return newEntity;
  }
}
