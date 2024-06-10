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
  #initialValues: Record<string, Primitive>;

  constructor(entity: Entity, initialValues: Record<string, Primitive>) {
    this.#entity = entity;
    this.#registry = entity.game.syncedValues;
    this.#values = [];
    this.#initialValues = initialValues;
  }

  get all() {
    return this.#values;
  }

  value(
    typeTag: PrimitiveTypeTag,
    name: string,
    defaultValue: Primitive
  ): SyncedValue {
    const identifier = `${this.#entity.ref}/${name}`;
    if (this.#values.some((v) => v.identifier === identifier))
      throw new Error(
        `A value with the name '${name}' already exists on this entity!`
      );

    const initial = this.#initialValues[name];
    const initialMatches =
      (typeof initial === "string" && typeTag === String) ||
      (typeof initial === "number" && typeTag === Number) ||
      (typeof initial === "boolean" && typeTag === Boolean);

    const value = new SyncedValue(
      this.#registry,
      identifier,
      initialMatches ? initial : defaultValue,
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
