// TODO: everything

import type { Behavior, Entity } from "@dreamlab/engine";
import type { SyncedObjectContainer } from "./registry.ts";

type SyncedObjectTarget = string[]; // TODO

export function sync<Container extends Entity | Behavior, Field extends SyncedObjectTarget>(
  opts: {
    name?: string;
    type?: unknown; // TODO: type markers (registry lookup)
    description?: string;
  } = {},
): (_: undefined, ctx: ClassFieldDecoratorContext<Container, Field>) => void {
  return (_, ctx) => {
    if (typeof ctx.name !== "string") return;
    if (ctx.static) return;
    if (ctx.private) throw new Error("can't sync a private field!");

    const field = ctx.name;
    ctx.addInitializer(function () {
      // TODO
    });
  };
}

export function setupSyncedObjects(container: SyncedObjectContainer): void {
  // TODO
}
