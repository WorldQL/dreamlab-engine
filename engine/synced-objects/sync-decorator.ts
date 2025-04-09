// TODO: everything

import { Behavior, ConnectionId, Entity } from "@dreamlab/engine";

type SyncedObjectTarget = string[];

type SyncedObject<Container> = {
  name: string;
  description?: string;

  accessor: ClassFieldDecoratorContext<Container, unknown>["access"];
  clock: number;
  lastWriter: ConnectionId;
};

export function sync<Container extends Entity | Behavior, Field extends SyncedObjectTarget>(
  opts: {
    name?: string;
    type?: unknown; // TODO: type markers (registry lookup)
    description?: string;
  } = {},
): (_: undefined, ctx: ClassFieldDecoratorContext<Container, Field>) => void {
  return (_, ctx) => {
    if (ctx.static) return;
    if (ctx.private) throw new Error("can't sync a private field!");

    // TODO
  };
}
