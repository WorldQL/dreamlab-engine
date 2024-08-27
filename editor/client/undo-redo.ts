import { Entity, EntityDefinition } from "@dreamlab/engine";
export type UndoRedoOperations =
  | "createEntities"
  | "destroyEntities"
  | "transformChange"
  | "addBehavior"
  | "removeBehavior"
  | "modifyBehaviorValue";

export interface EntityDefWithParent {
  def: EntityDefinition<Entity>;
  parent: Entity;
}
export interface ChangeOperation {
  operation: UndoRedoOperations;
  entities?: Entity[];
  entityDefinitions?: EntityDefWithParent[];
}

declare global {
  interface Window {
    // add you custom properties and methods
    undoStack: ChangeOperation[];
    redoStack: ChangeOperation[];
  }
}
