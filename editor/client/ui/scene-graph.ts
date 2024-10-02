import {
  ClientGame,
  Entity,
  EntityChildSpawned,
  EntityDestroyed,
  EntityRenamed,
  EntityReparented,
  Root,
} from "@dreamlab/engine";
import { element as elem, element } from "@dreamlab/ui";
import { EditorMetadataEntity, EditorRootFacadeEntity, Facades } from "../../common/mod.ts";
import { ChevronDown, icon } from "../_icons.ts";
import { createEntityMenu } from "../util/entity-types.ts";
import { ContextMenuItem } from "./context-menu.ts";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

function eventTargetsEntry(event: Event, entryElement: HTMLElement) {
  if (!(event.target instanceof HTMLElement)) return false;
  return event.target.closest("details[data-entity]") === entryElement;
}

export class SceneGraph implements InspectorUIWidget {
  #section: HTMLElement = elem("section", { id: "scene-graph" }, [
    elem("h1", {}, ["Scene Graph"]),
  ]);

  entryElementMap = new Map<string, HTMLElement>();
  currentDragSource: [entity: Entity, entry: HTMLElement] | undefined;
  #openEntities: Set<string> = new Set();

  constructor(private game: ClientGame) {
    const savedState = localStorage.getItem(`${this.game.worldId}/editor/openEntities`);
    if (savedState) {
      this.#openEntities = new Set(JSON.parse(savedState));
    }
  }

  #saveOpenEntities() {
    localStorage.setItem(
      `${this.game.worldId}/editor/openEntities`,
      JSON.stringify([...this.#openEntities]),
    );
  }

  setup(ui: InspectorUI): void {
    const treeRoot = elem("div", { id: "scene-graph-tree" });
    this.#section.append(treeRoot);

    this.handleEntitySelection(ui, treeRoot);

    if (ui.editMode) {
      this.renderEntry(ui, treeRoot, this.game.world._.EditEntities._.world);
      this.renderEntry(ui, treeRoot, this.game.world._.EditEntities._.local);
      this.renderEntry(ui, treeRoot, this.game.world._.EditEntities._.server);
      this.renderEntry(ui, treeRoot, this.game.world._.EditEntities._.prefabs);
    } else {
      this.renderEntry(ui, treeRoot, this.game.world);
      this.renderEntry(ui, treeRoot, this.game.local);
      this.renderEntry(ui, treeRoot, this.game.prefabs);
    }

    const world = ui.editMode ? this.game.world._.EditEntities._.world : this.game.world;

    this.#section.addEventListener("contextmenu", event => {
      event.preventDefault();
      event.stopPropagation();

      ui.contextMenu.drawContextMenu(event.clientX, event.clientY, [
        createEntityMenu("New Entity", type => {
          const newEntity = world.spawn({
            type: Facades.lookupFacadeEntityType(type),
            name: type.name,
            transform: {
              position: this.game.local._.Camera.globalTransform.position,
            },
          });
          const newEntryElement = this.entryElementMap.get(newEntity.ref);
          if (newEntryElement) this.triggerRename(newEntity, newEntryElement);
        }),
      ]);
    });
  }

  show(uiRoot: HTMLElement): void {
    const left = uiRoot.querySelector("#left-sidebar")!;
    left.prepend(this.#section);
  }

  hide(): void {
    this.#section.remove();
  }

  sortEntries(parent: HTMLElement) {
    const entries = Array.from(parent.querySelectorAll(":scope > details[data-entity]")).map(
      entry => {
        const entity = this.game.entities.lookupByRef(
          (entry as HTMLDetailsElement).dataset.entity!,
        );
        if (entity === undefined) throw new Error("how, dog");
        return [entry, entity] as const;
      },
    );

    const isStringParseableToInt = (s: string | undefined): s is string => {
      if (s === undefined) {
        return false;
      }
      return !isNaN(parseInt(s));
    };

    entries.sort(([_aEntry, a], [_bEntry, b]) => {
      const aSplit = a.name.split(".");
      const bSplit = b.name.split(".");

      if (aSplit.shift() === bSplit.shift()) {
        const ap = aSplit.pop();
        const bp = bSplit.pop();

        if (isStringParseableToInt(ap) && isStringParseableToInt(bp)) {
          // sort by trailing number after dot
          const partA = parseInt(ap);
          const partB = parseInt(bp);
          return partA - partB;
        }
      }

      return a.name.localeCompare(b.name);
    });

    for (const [entry, _] of entries) {
      parent.removeChild(entry);
      parent.append(entry);
    }
  }

  renderEntry(ui: InspectorUI, parent: HTMLElement, entity: Entity) {
    if (entity instanceof EditorMetadataEntity) return;

    const currentEntityRef = entity.ref;

    const toggle = elem("div", { className: "arrow" }, [icon(ChevronDown)]);
    const summary = elem("summary", {}, [
      toggle,
      elem("a", {}, [
        elem("span", { className: "icon" }, [
          (entity.constructor as typeof Entity).icon ?? "🌟",
        ]),
        " ",
        elem("span", { className: "name" }, [entity.name]),
      ]),
    ]);

    const entryElement = elem(
      "details",
      { open: this.#openEntities.has(currentEntityRef) || entity.children.size === 0 },
      [summary],
    );
    entryElement.dataset.entity = entity.ref;
    this.entryElementMap.set(entity.ref, entryElement);

    toggle.addEventListener("click", () => {
      entryElement.open = !entryElement.open;

      if (entryElement.open) {
        this.#openEntities.add(currentEntityRef);
      } else {
        this.#openEntities.delete(currentEntityRef);
      }
      this.#saveOpenEntities();
    });

    summary.addEventListener("click", ev => {
      ev.preventDefault();
    });

    // TODO: maybe some 'click to show more' thing would work well here
    const tooManyEntities = element("div", { className: "too-many-entities" }, [
      `[${entity.children.size} entities not shown]`,
    ]);

    entity.on(EntityChildSpawned, event => {
      const newEntity = event.child;
      if (entity.children.size > 2500) {
        tooManyEntities.textContent = `[${entity.children.size} entities not shown]`;
        entryElement.innerHTML = "";
        entryElement.append(summary);
        entryElement.append(tooManyEntities);
      } else {
        this.renderEntry(ui, entryElement, newEntity);
      }
    });

    entity.on(EntityReparented, () => {
      const parent = entity.parent;
      if (parent === undefined) return;
      const parentElement = this.entryElementMap.get(parent.ref);
      if (parentElement === undefined) return;
      parentElement.append(entryElement);

      this.sortEntries(parentElement);
    });

    entity.on(EntityDestroyed, () => {
      entryElement.remove();
    });

    entity.on(EntityRenamed, () => {
      const name = entryElement.querySelector(":scope > summary .name")!;
      name.textContent = entity.name;
    });

    this.handleEntryDragAndDrop(entity, entryElement);
    this.handleEntryRename(entity, entryElement);
    this.handleEntryContextMenu(ui, entity, entryElement);

    parent.append(entryElement);
    if (entity.children.size > 2500) {
      entryElement.append(tooManyEntities);
    } else {
      for (const child of entity.children.values()) {
        this.renderEntry(ui, entryElement, child);
      }
      this.sortEntries(entryElement);
    }
  }

  handleEntryRename(entity: Entity, entryElement: HTMLElement) {
    if (entity instanceof EditorRootFacadeEntity || entity instanceof Root) return;

    entryElement.addEventListener("dblclick", event => {
      if (!eventTargetsEntry(event, entryElement)) return;
      if (entryElement.querySelector(":scope > summary input")) return;
      this.triggerRename(entity, entryElement);
    });
  }

  triggerRename(entity: Entity, entryElement: HTMLElement) {
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
      reset();
    });
  }

  handleEntryDragAndDrop(entity: Entity, entryElement: HTMLElement) {
    entryElement.addEventListener("dragover", event => {
      if (!eventTargetsEntry(event, entryElement)) return;

      if (!this.currentDragSource) return;
      const [otherEntity, _] = this.currentDragSource;
      if (otherEntity === entity) return;
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
      const [otherEntity, _] = this.currentDragSource;
      if (otherEntity === entity) return;

      if (event.getModifierState("Control")) {
        otherEntity.cloneInto(entity);
      } else {
        otherEntity.parent = entity;
      }
    });

    if (entity.parent?.id === "game.world._.EditEntities") return;

    entryElement.draggable = true;

    entryElement.addEventListener("dragstart", event => {
      if (!eventTargetsEntry(event, entryElement)) return;

      this.currentDragSource = [entity, entryElement];
    });

    entryElement.addEventListener("dragend", () => {
      this.currentDragSource = undefined;
    });
  }

  handleEntryContextMenu(ui: InspectorUI, entity: Entity, entryElement: HTMLElement) {
    const summary = entryElement.querySelector(":scope > summary")! as HTMLElement;
    summary.addEventListener("contextmenu", event => {
      event.preventDefault();
      event.stopPropagation();

      ui.selectedEntity.entities = [entity];

      const contextMenuItems: ContextMenuItem[] = [
        ["Focus", () => this.game.local._.Camera.pos.assign(entity.pos)],
        createEntityMenu("New Entity", type => {
          const newEntity = entity.spawn({
            type: Facades.lookupFacadeEntityType(type),
            name: type.name,
            transform: {
              position: this.game.local._.Camera.globalTransform.position,
            },
          });
          const newEntryElement = this.entryElementMap.get(newEntity.ref);
          if (newEntryElement) this.triggerRename(newEntity, newEntryElement);
        }),
      ];

      if (!entity.protected) contextMenuItems.push(["Delete", () => entity.destroy()]);

      ui.contextMenu.drawContextMenu(event.clientX, event.clientY, contextMenuItems);
    });
  }

  handleEntitySelection(ui: InspectorUI, treeRoot: HTMLElement) {
    ui.selectedEntity.listen(() => {
      for (const [entityRef, entry] of this.entryElementMap.entries()) {
        const entity = this.game.entities.lookupByRef(entityRef);
        if (entity && ui.selectedEntity.entities.includes(entity)) {
          entry.classList.add("selected");
        } else {
          entry.classList.remove("selected");
        }
      }
    });

    treeRoot.addEventListener("click", event => {
      if (!(event.target instanceof Element)) return;

      // TODO: handle range-select
      const selectMultiple = event.getModifierState("Control");

      const entryElement = event.target.closest("details[data-entity] > summary")?.parentNode;
      if (!entryElement) {
        if (!selectMultiple) ui.selectedEntity.entities = [];
        return;
      }
      const entity = this.game.entities.lookupByRef(
        (entryElement as HTMLDetailsElement).dataset.entity!,
      );
      if (!entity) return;

      if (selectMultiple) {
        if (ui.selectedEntity.entities.includes(entity)) {
          ui.selectedEntity.entities = ui.selectedEntity.entities.filter(e => e !== entity);
        } else {
          ui.selectedEntity.entities = [...ui.selectedEntity.entities, entity];
        }
      } else {
        ui.selectedEntity.entities = [entity];
      }
    });
  }
}
