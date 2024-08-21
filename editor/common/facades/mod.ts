import { EntityConstructor, EntityDefinition } from "@dreamlab/engine";
import "./edit-roots.ts";

export class Facades {
  static #facades = new Map<EntityConstructor, EntityConstructor>();
  static #reverse = new Map<EntityConstructor, EntityConstructor>();

  static register(entity: EntityConstructor, facade: EntityConstructor): void {
    this.#facades.set(entity, facade);
    this.#reverse.set(facade, entity);
  }

  static lookupFacadeEntityType(entityType: EntityConstructor): EntityConstructor {
    return this.#facades.get(entityType) ?? entityType;
  }

  static reverseFacadeEntityType(entityType: EntityConstructor): EntityConstructor {
    return this.#reverse.get(entityType) ?? entityType;
  }

  static useEditorFacades(def: EntityDefinition) {
    def.type = this.lookupFacadeEntityType(def.type);
    def.children?.forEach(c => this.useEditorFacades(c));
    return def;
  }

  static dropEditorFacades(def: EntityDefinition) {
    def.type = this.reverseFacadeEntityType(def.type);
    def.children?.forEach(c => this.dropEditorFacades(c));
    return def;
  }
}
