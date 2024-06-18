import { Behavior } from "./behavior.ts";
import { Primitive, SyncedValue, ValueTypeTag, ValueTypeAdapter } from "../value/mod.ts";

export class BehaviorValues<B extends Behavior> {
  #behavior: B;
  #values: SyncedValue[];
  #initialValues: Record<string, Primitive>;

  constructor(behavior: B, initialValues: Record<string, Primitive>) {
    this.#behavior = behavior;
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
    const id = `${this.#behavior.entity.ref}/${this.#behavior.ref}/${name}`;
    if (this.#values.some(v => v.identifier === id))
      throw new Error(`A value with the name '${name}' already exists on this entity!`);

    const initial = this.#initialValues[name] as SyncedValue<T>["value"];
    const initialMatches =
      (typeof initial === "string" && typeTag === String) ||
      (typeof initial === "number" && typeTag === Number) ||
      (typeof initial === "boolean" && typeTag === Boolean) ||
      typeTag instanceof ValueTypeAdapter;

    const registry = this.#behavior.entity.game.syncedValues;
    const value = new SyncedValue<T>(
      registry,
      id,
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
