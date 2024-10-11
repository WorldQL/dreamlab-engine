import type { ITransform } from "@dreamlab/engine";
import { ClientGame, EntityDefinition } from "@dreamlab/engine";

class NotImplementedError extends Error {}

/**
 * Operations are presented literally.
 * Undo-ing a create op will perform a delete.
 */
export type UndoRedoOperation =
  | { t: "create-entity"; parentRef: string; def: EntityDefinition }
  | { t: "destroy-entity"; parentRef: string; def: EntityDefinition }
  | { t: "transform-change"; entityRef: string; previous: ITransform; transform: ITransform }
  // | { t: "add-behavior" }
  // | { t: "remove-behavior" }
  // | { t: "modify-entity-value" }
  // | { t: "modify-behavior-value" }
  | { t: "compound"; ops: Exclude<UndoRedoOperation, { t: "compound" }>[] };

export class UndoRedoManager {
  static _: UndoRedoManager;

  #undoStack: UndoRedoOperation[] = [];
  #redoStack: UndoRedoOperation[] = [];

  #game: ClientGame;
  constructor(game: ClientGame) {
    if (UndoRedoManager._ !== undefined) {
      throw new Error("UndoRedoManager instantiated more than once");
    }

    this.#game = game;
    UndoRedoManager._ = this;
  }

  public push(op: UndoRedoOperation): void {
    this.#redoStack.length = 0;
    this.#undoStack.push(op);
  }

  public undo(): UndoRedoOperation | undefined {
    const op = this.#undoStack.pop();
    if (op === undefined) return;

    try {
      this.#applyUndo(op);
      this.#redoStack.push(op);

      return op;
    } catch (error) {
      if (error instanceof NotImplementedError) throw error;
      console.warn("undo operation failed. ignoring");
      console.log(error);
    }
  }

  public redo(): UndoRedoOperation | undefined {
    const op = this.#redoStack.pop();
    if (op === undefined) return;

    try {
      this.#applyRedo(op);
      this.#undoStack.push(op);

      return op;
    } catch (error) {
      if (error instanceof NotImplementedError) throw error;
      console.warn("redo operation failed. ignoring");
      console.log(error);
    }
  }

  #applyUndo(op: UndoRedoOperation): void {
    switch (op.t) {
      case "compound": {
        for (const sub of op.ops) {
          this.#applyUndo(sub);
        }

        break;
      }

      case "create-entity": {
        if (!op.def._ref) throw new Error("entity defintion should have a ref");
        const entity = this.#game.entities.lookupByRef(op.def._ref);
        entity?.destroy();

        break;
      }

      case "destroy-entity": {
        const parent = this.#game.entities.lookupByRef(op.parentRef);
        parent?.spawn(op.def);

        break;
      }

      case "transform-change": {
        const entity = this.#game.entities.lookupByRef(op.entityRef);
        entity?.setGlobalTransform(op.previous);

        break;
      }

      default: {
        const t = (op as unknown as UndoRedoOperation).t;
        throw new NotImplementedError(`undo operation not implemented: ${t}`);
      }
    }
  }

  #applyRedo(op: UndoRedoOperation): void {
    switch (op.t) {
      case "compound": {
        for (const sub of op.ops) {
          this.#applyRedo(sub);
        }

        break;
      }

      case "create-entity": {
        const parent = this.#game.entities.lookupByRef(op.parentRef);
        parent?.spawn(op.def);

        break;
      }

      case "destroy-entity": {
        if (!op.def._ref) throw new Error("entity defintion should have a ref");
        const entity = this.#game.entities.lookupByRef(op.def._ref);
        entity?.destroy();

        break;
      }

      case "transform-change": {
        const entity = this.#game.entities.lookupByRef(op.entityRef);
        entity?.setGlobalTransform(op.transform);

        break;
      }

      default: {
        const t = (op as unknown as UndoRedoOperation).t;
        throw new NotImplementedError(`redo operation not implemented: ${t}`);
      }
    }
  }
}
