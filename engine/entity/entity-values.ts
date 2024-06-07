import { Entity } from "./entity.ts";
import {
  Primitive,
  PrimitiveTypeTag,
  SyncedValue,
  SyncedValueRegistry,
} from "../value.ts";

export class EntityValues {
  #entity: Entity;
  #registry: SyncedValueRegistry;
  #values: SyncedValue[];

  constructor(entity: Entity) {
    this.#entity = entity;
    this.#registry = entity.game.syncedValues;
    this.#values = [];
  }

  get all() {
    return this.#values;
  }

  value(
    typeTag: PrimitiveTypeTag,
    name: string,
    defaultValue: Primitive
  ): SyncedValue {
    const value = new SyncedValue(
      this.#registry,
      `${this.#entity.ref}/${name}`,
      defaultValue,
      typeTag
    );
    this.#values.push(value);
    return value;
  }

  number(name: string, defaultValue: number): SyncedValue<number> {
    return this.value(Number, name, defaultValue) as SyncedValue<number>;
  }

  string(name: string, defaultValue: string): SyncedValue<string> {
    return this.value(String, name, defaultValue) as SyncedValue<string>;
  }

  boolean(name: string, defaultValue: boolean): SyncedValue<boolean> {
    return this.value(Boolean, name, defaultValue) as SyncedValue<boolean>;
  }

  destroy() {
    for (const value of this.#values) {
      value.destroy();
    }
  }
}