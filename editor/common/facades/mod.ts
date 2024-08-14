import { Camera, EntityConstructor, EntityDefinition } from "@dreamlab/engine";
import { EditorFacadeCamera } from "./camera.ts";
import "./edit-roots.ts";

export function lookupFacadeEntityType(entityType: EntityConstructor): EntityConstructor {
  if (entityType === Camera) return EditorFacadeCamera;

  return entityType;
}

export function reverseFacadeEntityType(entityType: EntityConstructor): EntityConstructor {
  if (entityType === EditorFacadeCamera) return Camera;

  return entityType;
}

export function useEditorFacades(def: EntityDefinition) {
  def.type = lookupFacadeEntityType(def.type);
  def.children?.forEach(c => useEditorFacades(c));
  return def;
}

export function dropEditorFacades(def: EntityDefinition) {
  def.type = reverseFacadeEntityType(def.type);
  def.children?.forEach(c => useEditorFacades(c));
  return def;
}
