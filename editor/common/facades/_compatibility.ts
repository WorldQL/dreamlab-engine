import { Entity } from "@dreamlab/engine";
import { ConditionalExcept } from "@dreamlab/vendor/type-fest.ts";

// TODO: this should be exported from entity.ts lol
type EntityValueProp<E extends Entity> = Exclude<
  // deno-lint-ignore ban-types
  keyof ConditionalExcept<E, Function>,
  keyof Entity
>;

export type EntityValueProps<E extends Entity> = {
  [T in keyof E as T extends EntityValueProp<E> ? T : never]: E[T];
};
export type EnsureCompatible<Base, Facade extends Base> = Facade;
