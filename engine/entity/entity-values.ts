import { Entity } from "./entity.ts";
import {
  SyncedValue,
  SyncedValueRegistry,
  ValueTypeAdapter,
  ValueTypeTag,
} from "../value/mod.ts";
import { JsonValue } from "../value/data.ts";

export class EntityValues {
  #entity: Entity;
  #registry: SyncedValueRegistry;
  #values: SyncedValue[];
  #initialValues: Record<string, JsonValue>;

  constructor(entity: Entity, initialValues: Record<string, JsonValue>) {
    this.#entity = entity;
    this.#registry = entity.game.syncedValues;
    this.#values = [];
    this.#initialValues = initialValues;
  }

  get all() {
    return this.#values;
  }

  value<T>(
    typeTag: ValueTypeTag<T>,
    name: string,
    defaultValue: SyncedValue<T>["value"],
  ): SyncedValue<T> {
    const identifier = `${this.#entity.ref}/${name}`;
    if (this.#values.some(v => v.identifier === identifier))
      throw new Error(`A value with the name '${name}' already exists on this entity!`);

    const initial = this.#initialValues[name] as SyncedValue<T>["value"];
    const initialMatches =
      (typeof initial === "string" && typeTag === String) ||
      (typeof initial === "number" && typeTag === Number) ||
      (typeof initial === "boolean" && typeTag === Boolean) ||
      typeTag instanceof ValueTypeAdapter;

    const value = new SyncedValue<T>(
      this.#registry,
      identifier,
      initialMatches ? initial : defaultValue,
      typeTag,
    );
    this.#values.push(value);
    return value;
  }

  number(name: string, defaultValue: number): SyncedValue<number> {
    return this.value(Number, name, defaultValue);
  }

  string(name: string, defaultValue: string): SyncedValue<string> {
    return this.value(String, name, defaultValue);
  }

  boolean(name: string, defaultValue: boolean): SyncedValue<boolean> {
    return this.value(Boolean, name, defaultValue);
  }

  destroy() {
    for (const value of this.#values) {
      value.destroy();
    }
  }
}
