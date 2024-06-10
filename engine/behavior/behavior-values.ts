import { Behavior } from "./behavior.ts";
import { Entity } from "../entity/mod.ts";
import { Primitive, PrimitiveTypeTag, SyncedValue } from "../value.ts";

export class BehaviorValues<
  E extends Entity = Entity,
  B extends Behavior<E> = Behavior<E>
> {
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

  value(
    typeTag: PrimitiveTypeTag,
    name: string,
    defaultValue: Primitive
  ): SyncedValue {
    const id = `${this.#behavior.entity.ref}/${this.#behavior.ref}/${name}`;
    if (this.#values.some((v) => v.identifier === id))
      throw new Error(
        `A value with the name ${name} already exists on this behavior!`
      );

    const initial = this.#initialValues[name];
    const initialMatches =
      (typeof initial === "string" && typeTag === String) ||
      (typeof initial === "number" && typeTag === Number) ||
      (typeof initial === "boolean" && typeTag === Boolean);

    const registry = this.#behavior.entity.game.syncedValues;
    const value = new SyncedValue(
      registry,
      id,
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
