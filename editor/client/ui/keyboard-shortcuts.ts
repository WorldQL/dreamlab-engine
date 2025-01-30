import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import {
  BoxResizeGizmoResizeEnd,
  ClientGame,
  Entity,
  GizmoUpdateEnd,
  type ITransform,
} from "@dreamlab/engine";
import {
  EditorMetadataEntity,
  LocalRootFacade,
  PrefabRootFacade,
  ServerRootFacade,
  WorldRootFacade,
} from "../../common/mod.ts";
import { Check, Save } from "../_icons.ts";
import { IconButton } from "../components/icon-button.ts";
import type { UndoRedoOperation } from "../undo-redo.ts";
import { UndoRedoManager } from "../undo-redo.ts";
import { SelectedEntityService } from "./selected-entity.ts";

export function isRoot(e: Entity): boolean {
  return (
    e instanceof WorldRootFacade ||
    e instanceof LocalRootFacade ||
    e instanceof ServerRootFacade ||
    e instanceof PrefabRootFacade
  );
}

function filterChildNodes(toDelete: Entity[]) {
  // remove any entities that are children of entities scheduled for deletion
  // we have to use a mark and sweep technique here.
  const indicesToExcludeFromDeletion: number[] = [];

  for (let i = 0; i < toDelete.length; i++) {
    if (isRoot(toDelete[i].parent!)) {
      continue;
    }

    let pointer = toDelete[i].parent!;
    while (true) {
      for (const other of toDelete) {
        if (other == pointer) {
          indicesToExcludeFromDeletion.push(i);
          break;
        }
      }
      if (isRoot(pointer.parent!)) break;
      pointer = pointer.parent!;
    }
  }

  let acc = 0;
  for (const itd of indicesToExcludeFromDeletion) {
    toDelete.splice(itd - acc, 1);
    // account for the deleted element
    acc--;
  }
}

// spamming undo/redo results in loss of child entities.
class CooldownManager {
  private cooldowns: Map<string, number> = new Map();
  private readonly cooldownDuration: number = 200; // 200ms cooldown

  isOnCooldown(key: string): boolean {
    const now = Date.now();
    const lastUsed = this.cooldowns.get(key);

    if (lastUsed === undefined || now - lastUsed >= this.cooldownDuration) {
      // Not on cooldown or cooldown has expired
      this.cooldowns.set(key, now);
      return false;
    }

    // On cooldown
    return true;
  }
}

export const Clipboard = {
  copiedEntities: [] as Entity[],
  set(entities: Entity[]) {
    this.copiedEntities = [...entities];
  },
  get(): Entity[] {
    return [...this.copiedEntities];
  },
  clear() {
    this.copiedEntities = [];
  },
};

export function setupKeyboardShortcuts(
  game: ClientGame,
  selectedService: SelectedEntityService,
  editMode: boolean,
) {
  // TODO: Make keyboard shortcuts work in play mode again.
  if (!editMode) return;
  const cooldownManager = new CooldownManager();

  const saveProject = async () => {
    const url = new URL(connectionDetails.serverUrl);
    url.pathname = `/api/v1/save-edit-session/${game.instanceId}`;

    const saveButton = document.getElementById("save-button") as IconButton;
    if (!saveButton) return;

    const button = saveButton.querySelector("button")!;
    try {
      button.disabled = true;
      await fetch(url, { method: "POST" });

      button.style.backgroundColor = "rgb(var(--color-green) / 1)";
      saveButton.setIcon(Check);

      setTimeout(() => {
        button.style.backgroundColor = "";
        saveButton.setIcon(Save);
      }, 3000);
    } finally {
      button.disabled = false;
      window.parent.postMessage({ action: "reloadProject" }, "*");
    }
  };

  // TODO: do we want to move these signal listeners?
  // yes, to undo-redo.ts probably but I don't want to do it right now.
  game.on(GizmoUpdateEnd, ({ entities }) => {
    UndoRedoManager._.push({
      t: "compound",
      ops: entities.map(({ entity, transform, previous }) => ({
        t: "transform-change",
        entityRef: entity.ref,
        transform,
        previous,
      })),
    });
  });

  game.on(BoxResizeGizmoResizeEnd, ({ entity, previous: prev }) => {
    const transform = entity.globalTransform.bare();
    const previous = {
      ...transform,
      position: prev.position.bare(),
      scale: prev.scale.bare(),
    } satisfies ITransform;

    UndoRedoManager._.push({
      t: "transform-change",
      entityRef: entity.ref,
      transform,
      previous,
    });
  });

  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (document.activeElement instanceof HTMLInputElement) {
      return;
    }
    if ((window.getSelection()?.toString().length ?? 0) > 0) {
      return;
    }

    // Enable/disable
    if (event.key === "e" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      for (const e of selectedService.entities) {
        if (isRoot(e)) continue;
        e.enabled = !e.enabled;
      }
      return;
    }
    // Copy
    if (event.key === "c" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      Clipboard.set([...selectedService.entities.filter(e => !isRoot(e))]);
      return;
    }

    // Paste
    /*
    Rules:
    - If we're selecting a single entity, we paste under that.
    - If we're selecting the entity(ies) we copied, we paste alongside them
    - If we're selecting multiple entities we do not paste.
    */
    if (event.key === "v" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      const copiedEntities = Clipboard.get();
      const pastedEntities: Entity[] = [];

      if (copiedEntities.length === 0) return;

      if (selectedService.entities.length === 1 && copiedEntities.length === 1) {
        const selected = selectedService.entities[0];
        const copied = copiedEntities[0];

        if (copied === selected) {
          pastedEntities.push(copied.cloneInto(selected.parent!));
        } else {
          // paste alongside
          pastedEntities.push(copied.cloneInto(selected));
        }
      } else {
        let shouldPasteAlongside = true;
        // check if we're selecting the same entities we copied so we can paste alongside if needed
        if (selectedService.entities.length !== copiedEntities.length)
          shouldPasteAlongside = false;

        const firstParent = copiedEntities[0].parent!.ref;
        if (shouldPasteAlongside) {
          for (const copied of copiedEntities) {
            let found = false;
            for (const selected of selectedService.entities) {
              if (selected.ref === copied.ref) found = true;
            }
            if (!found) {
              shouldPasteAlongside = false;
              break;
            }
            if (copied.parent!.ref !== firstParent) {
              // only paste alongside if all entities are at the same level
              shouldPasteAlongside = false;
            }
          }
        }

        if (shouldPasteAlongside) {
          for (const copied of copiedEntities) {
            pastedEntities.push(copied.cloneInto(copied.parent!));
          }
        } else if (selectedService.entities.length === 1) {
          for (const copied of copiedEntities) {
            pastedEntities.push(copied.cloneInto(selectedService.entities[0]));
          }
        } else {
          return;
        }
      }

      const ops = pastedEntities.map(
        x =>
          ({
            t: "create-entity",
            parentRef: x.parent!.ref,
            def: x.getDefinition(),
          }) satisfies UndoRedoOperation,
      );

      UndoRedoManager._.push({ t: "compound", ops });
      return;
    }

    // Delete
    if (event.key === "Backspace") {
      const toDelete: Entity[] = [...selectedService.entities];
      filterChildNodes(toDelete);

      const ops = toDelete.map(
        x =>
          ({
            t: "destroy-entity",
            parentRef: x.parent!.ref,
            def: x.getDefinition(),
          }) satisfies UndoRedoOperation,
      );

      for (const entity of toDelete) {
        entity.destroy();
      }

      UndoRedoManager._.push({ t: "compound", ops });
      selectedService.entities = [];
      return;
    }

    // Undo
    if (event.key === "z" && (event.ctrlKey || event.metaKey)) {
      if (
        !(
          document.activeElement &&
          ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (cooldownManager.isOnCooldown("undo")) return;

      const op = UndoRedoManager._.undo();
      const selectedEntityRefs = selectedService.entities.map(e => e.ref);
      if (op?.t === "create-entity" && selectedEntityRefs.includes(op.def._ref ?? ""))
        selectedService.entities = [];

      return;
    }

    // Redo
    if (event.key === "y" && (event.ctrlKey || event.metaKey)) {
      if (
        !(
          document.activeElement &&
          ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (cooldownManager.isOnCooldown("redo")) return;

      const op = UndoRedoManager._.redo();

      const selectedEntityRefs = selectedService.entities.map(e => e.ref);
      if (
        op?.t === "compound" &&
        op.ops.some(
          op => op.t === "destroy-entity" && selectedEntityRefs.includes(op.def._ref ?? ""),
        )
      )
        selectedService.entities = [];

      return;
    }

    // Save Project
    if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      saveProject();
      return;
    }

    // Up and Down Arrow Navigation
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const entries = Array.from(
        document.querySelectorAll("#scene-graph-tree details[data-entity]"),
      ) as HTMLElement[];

      if (entries.length === 0) return;

      const currentSelected = entries.find(entry => entry.classList.contains("selected"));

      let newIndex = 0;

      if (currentSelected) {
        const currentIndex = entries.indexOf(currentSelected);
        newIndex =
          event.key === "ArrowUp"
            ? Math.max(0, currentIndex - 1)
            : Math.min(entries.length - 1, currentIndex + 1);

        currentSelected.classList.remove("selected");
      }

      const newSelected = entries[newIndex];
      newSelected.classList.add("selected");
      newSelected.scrollIntoView({ behavior: "smooth", block: "center" });

      const entityRef = newSelected.dataset.entity!;
      const entity = game.entities.lookupByRef(entityRef);
      if (entity) selectedService.entities = [entity];
      return;
    }

    if (event.key === "L" && event.shiftKey && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();

      const lockedEntities = selectedService.entities.filter(
        entity => EditorMetadataEntity.getInstanceFor(entity)?.locked,
      );

      const unlock = lockedEntities.length > 0;

      selectedService.entities.forEach(entity => {
        const metadata = EditorMetadataEntity.getInstanceFor(entity);
        if (!metadata) return;

        const prevLocked = metadata.locked;
        metadata.locked = !unlock;
        UndoRedoManager._.push({
          t: "modify-entity-locked",
          entityRef: entity.ref,
          locked: !unlock,
          previous: prevLocked,
        });
      });

      return;
    }

    // Exit selected
    if (event.key === "Escape") {
      selectedService.entities = [];
    }
  });
}
