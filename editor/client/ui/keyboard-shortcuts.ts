import { ClientGame, Entity, EntityDefinition } from "@dreamlab/engine";
import { SelectedEntityService } from "./selected-entity.ts";
import {
  LocalRootFacade,
  PrefabRootFacade,
  ServerRootFacade,
  WorldRootFacade,
} from "../../common/mod.ts";
import { EntityDefWithParent } from "../undo-redo.ts";

function isRoot(e: Entity): boolean {
  if (
    e instanceof WorldRootFacade ||
    e instanceof LocalRootFacade ||
    e instanceof ServerRootFacade ||
    e instanceof PrefabRootFacade
  ) {
    return true;
  }
  return false;
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

    console.log("oncd");
    // On cooldown
    return true;
  }
}

export function setupKeyboardShortcuts(
  game: ClientGame,
  selectedService: SelectedEntityService,
) {
  let currentlyCopiedEntities: Entity[] = [];
  const cooldownManager = new CooldownManager();

  window.undoStack = [];
  window.redoStack = [];

  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (document.activeElement instanceof HTMLInputElement) {
      return;
    }
    for (const e of selectedService.entities) {
      if (isRoot(e)) {
        return;
      }
    }
    if ((window.getSelection()?.toString().length ?? 0) > 0) {
      return;
    }

    // Copy
    if (event.key === "c" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      console.log("copy");
      currentlyCopiedEntities = [...selectedService.entities];
      return;
    }

    // Paste
    if (event.key === "v" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      const pastedEntities: Entity[] = [];
      if (selectedService.entities.length === 1 && currentlyCopiedEntities.length === 1) {
        const selected = selectedService.entities[0];
        const copied = currentlyCopiedEntities[0];
        if (copied === selected) {
          pastedEntities.push(copied.cloneInto(selected.parent!));
        } else {
          pastedEntities.push(copied.cloneInto(selected));
        }
      } else {
        for (const copied of currentlyCopiedEntities) {
          pastedEntities.push(copied.cloneInto(copied.parent!));
        }
      }
      window.undoStack.push({ operation: "destroyEntities", entities: pastedEntities });
      return;
    }

    // Enter to rename
    if (event.key === "Enter" && selectedService.entities.length === 1) {
      const inputElement = document.getElementById("rename-entity-input");
      if (inputElement instanceof HTMLInputElement) {
        inputElement.focus();
        inputElement.select();
      }
      return;
    }

    // Delete
    if (event.key === "Backspace") {
      event.preventDefault();
      const toDelete: Entity[] = [...selectedService.entities];
      filterChildNodes(toDelete);

      const deletedDefs: EntityDefWithParent[] = [];
      for (const entity of toDelete) {
        deletedDefs.push({ def: entity.getDefinition(), parent: entity.parent! });
        entity.destroy();
      }

      window.undoStack.push({ operation: "createEntities", entityDefinitions: deletedDefs });
      selectedService.entities = [];
      return;
    }

    // Undo
    if (event.key === "z" && (event.ctrlKey || event.metaKey)) {
      if (cooldownManager.isOnCooldown("undo")) return;

      const op = window.undoStack.pop();
      if (!op) return;

      if (op.operation === "createEntities") {
        const entities = [];
        for (const e of op.entityDefinitions!) {
          entities.push(e.parent.spawn(e.def));
        }
        window.redoStack.push({ operation: "destroyEntities", entities });
      } else if (op.operation === "destroyEntities") {
        const deletedDefs: EntityDefWithParent[] = [];
        for (const entity of op.entities!) {
          deletedDefs.push({ def: entity.getDefinition(), parent: entity.parent! });
          entity.destroy();
        }
        window.redoStack.push({ operation: "createEntities", entityDefinitions: deletedDefs });
      }
      selectedService.entities = [];
      return;
    }

    // Redo
    if (event.key === "y" && (event.ctrlKey || event.metaKey)) {
      if (cooldownManager.isOnCooldown("redo")) return;

      const op = window.redoStack.pop();
      if (!op) return;

      if (op.operation === "destroyEntities") {
        const deletedDefs: EntityDefWithParent[] = [];
        for (const entity of op.entities!) {
          deletedDefs.push({ def: entity.getDefinition(), parent: entity.parent! });
          entity.destroy();
        }
        window.undoStack.push({ operation: "createEntities", entityDefinitions: deletedDefs });
      } else if (op.operation === "createEntities") {
        const entities = [];
        for (const e of op.entityDefinitions!) {
          entities.push(e.parent.spawn(e.def));
        }
        window.undoStack.push({ operation: "destroyEntities", entities });
      }
      selectedService.entities = [];
      return;
    }
  });
}
