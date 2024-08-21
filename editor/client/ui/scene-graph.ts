import {
  ClientGame,
  Entity,
  EntityChildSpawned,
  EntityDestroyed,
  EntityRenamed,
  EntityReparented,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { element as elem } from "@dreamlab/ui";
import { EditorMetadataEntity } from "../../common/mod.ts";
import { ChevronDown, icon } from "../_icons.ts";
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

  constructor(private game: ClientGame) {}

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
      this.renderEntry(ui, treeRoot, this.game.prefabs);
    }

    const world = ui.editMode ? this.game.world._.EditEntities._.world : this.game.world;

    this.#section.addEventListener("contextmenu", event => {
      event.preventDefault();
      event.stopPropagation();

      ui.contextMenu.drawContextMenu(event.clientX, event.clientY, [
        [
          "New Entity",
          [...Entity[internal.entityTypeRegistry].entries()]
            .filter(([_, namespace]) => namespace !== "@editor")
            .map(([type, _]) => [type.name, () => world.spawn({ type, name: type.name })]),
        ],
      ]);
    });
  }

  show(uiRoot: HTMLElement): void {
    const left = uiRoot.querySelector("#left-sidebar")!;
    left.append(this.#section);
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

    const entryElement = elem("details", { open: true }, [summary]);
    entryElement.dataset.entity = entity.ref;
    this.entryElementMap.set(entity.ref, entryElement);

    toggle.addEventListener("click", () => {
      entryElement.open = !entryElement.open;
    });

    summary.addEventListener("click", ev => {
      ev.preventDefault();
    });

    entity.on(EntityChildSpawned, event => {
      const newEntity = event.child;
      this.renderEntry(ui, entryElement, newEntity);
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
    for (const child of entity.children.values()) {
      this.renderEntry(ui, entryElement, child);
    }
    this.sortEntries(entryElement);
  }

  handleEntryRename(entity: Entity, entryElement: HTMLElement) {
    if (entity.parent?.id === "game.world._.EditEntities") return;

    const name = entryElement.querySelector(":scope > summary .name")! as HTMLElement;
    entryElement.addEventListener("dblclick", event => {
      if (!eventTargetsEntry(event, entryElement)) return;
      if (entryElement.querySelector(":scope > summary input")) return;

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

      ui.contextMenu.drawContextMenu(event.clientX, event.clientY, [
        ["Focus", () => this.game.local._.Camera.pos.assign(entity.pos)],
        [
          "New Entity",
          [...Entity[internal.entityTypeRegistry].entries()]
            .filter(([_, namespace]) => namespace !== "@editor")
            .map(([type, _]) => [type.name, () => entity.spawn({ type, name: type.name })]),
        ],
        ["Delete", () => entity.destroy()],
      ]);
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
