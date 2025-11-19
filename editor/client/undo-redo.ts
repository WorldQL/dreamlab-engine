import type { ITransform } from "@dreamlab/engine";
import { BaseTilemap, ClientGame, EntityDefinition } from "@dreamlab/engine";
import { EditorMetadataEntity } from "../common/mod.ts";

class NotImplementedError extends Error {}

/**
 * Operations are presented literally.
 * Undo-ing a create op will perform a delete.
 */
export type UndoRedoOperation =
  | { t: "create-entity"; parentRef: string; def: EntityDefinition }
  | { t: "destroy-entity"; parentRef: string; def: EntityDefinition }
  | { t: "transform-change"; entityRef: string; previous: ITransform; transform: ITransform }
  | { t: "rename-entity"; entityRef: string; previous: string; name: string }
  | { t: "move-entity"; entityRef: string; prevParentRef: string; parentRef: string }
  // | { t: "add-behavior" }
  // | { t: "remove-behavior" }
  | {
      t: "modify-entity-value";
      entityRef: string;
      key: string;
      value: unknown;
      previous: unknown;
    }
  | {
      t: "modify-entity-transform";
      entityRef: string;
      path: string[];
      value: string;
      previous: string;
    }
  | {
      t: "modify-entity-locked";
      entityRef: string;
      locked: boolean;
      previous: boolean;
    }
  // | { t: "modify-behavior-value" }
  | {
      t: "modify-tilemap";
      tilemapRef: string;
      ops: {
        t: "atlas" | "color";
        x: number;
        y: number;
        id: number | undefined;
        previous: number | undefined;
      }[];
    }
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

      case "rename-entity": {
        const entity = this.#game.entities.lookupByRef(op.entityRef);
        if (entity) entity.name = op.previous;

        break;
      }

      case "move-entity": {
        const entity = this.#game.entities.lookupByRef(op.entityRef);
        const prevParent = this.#game.entities.lookupByRef(op.prevParentRef);
        if (entity && prevParent) entity.parent = prevParent;

        break;
      }

      case "modify-entity-value": {
        const entity = this.#game.entities.lookupByRef(op.entityRef);
        const v = entity?.values.get(op.key);
        if (v) v.value = op.previous;

        break;
      }

      case "modify-entity-transform": {
        const entity = this.#game.entities.lookupByRef(op.entityRef);

        if (entity && entity.transform) {
          changeAtPath(entity.transform, op.path, op.previous);
        }

        break;
      }

      case "modify-entity-locked": {
        const entity = this.#game.entities.lookupByRef(op.entityRef);
        const metadata = entity?.children.get("__EditorMetadata")?.cast(EditorMetadataEntity);
        if (metadata) {
          metadata.locked = op.previous;
        }
        break;
      }

      case "modify-tilemap": {
        const entity = this.#game.entities.lookupByRef(op.tilemapRef);
        if (entity && entity instanceof BaseTilemap) {
          const allAtlas = op.ops.every(x => x.t === "atlas");
          const allColor = op.ops.every(x => x.t === "color");

          if (allAtlas || allColor) {
            const xs: number[] = [];
            const ys: number[] = [];
            const ids: (number | undefined)[] = [];
            for (const { x, y, previous } of op.ops) {
              xs.push(x);
              ys.push(y);
              ids.push(previous);
            }

            if (allAtlas) entity.setTiles(xs, ys, ids);
            else if (allColor) entity.setColorTiles(xs, ys, ids);
          } else {
            for (const { x, y, previous, t } of op.ops) {
              if (t === "atlas") entity.setTile(x, y, previous);
              else if (t === "color") entity.setColor(x, y, previous);
            }
          }
        }
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

      case "rename-entity": {
        const entity = this.#game.entities.lookupByRef(op.entityRef);
        if (entity) entity.name = op.name;

        break;
      }

      case "move-entity": {
        const entity = this.#game.entities.lookupByRef(op.entityRef);
        const parent = this.#game.entities.lookupByRef(op.parentRef);
        if (entity && parent) entity.parent = parent;

        break;
      }

      case "modify-entity-value": {
        const entity = this.#game.entities.lookupByRef(op.entityRef);
        const v = entity?.values.get(op.key);
        if (v) v.value = op.value;

        break;
      }

      case "modify-entity-transform": {
        const entity = this.#game.entities.lookupByRef(op.entityRef);

        if (entity && entity.transform) {
          changeAtPath(entity.transform, op.path, op.value);
        }

        break;
      }

      case "modify-entity-locked": {
        const entity = this.#game.entities.lookupByRef(op.entityRef);
        const metadata = entity?.children.get("__EditorMetadata")?.cast(EditorMetadataEntity);
        if (metadata) {
          metadata.locked = op.locked;
        }
        break;
      }

      case "modify-tilemap": {
        const entity = this.#game.entities.lookupByRef(op.tilemapRef);
        if (entity && entity instanceof BaseTilemap) {
          const allAtlas = op.ops.every(x => x.t === "atlas");
          const allColor = op.ops.every(x => x.t === "color");

          if (allAtlas || allColor) {
            const xs: number[] = [];
            const ys: number[] = [];
            const ids: (number | undefined)[] = [];
            for (const { x, y, id } of op.ops) {
              xs.push(x);
              ys.push(y);
              ids.push(id);
            }

            if (allAtlas) entity.setTiles(xs, ys, ids);
            else if (allColor) entity.setColorTiles(xs, ys, ids);
          } else {
            for (const { x, y, id, t } of op.ops) {
              if (t === "atlas") entity.setTile(x, y, id);
              else if (t === "color") entity.setColor(x, y, id);
            }
          }
        }
        break;
      }

      default: {
        const t = (op as unknown as UndoRedoOperation).t;
        throw new NotImplementedError(`redo operation not implemented: ${t}`);
      }
    }
  }
}

function changeAtPath(object: any, path: string[], value: string) {
  let current = object;
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
  }
  let val = parseFloat(value);
  if (path[path.length - 1] === "rotation") {
    val = val * (Math.PI / 180);
  }
  current[path[path.length - 1]] = val;
}
