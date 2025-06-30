// TODO: everything

import type { Behavior, Entity, JsonValue } from "@dreamlab/engine";
import { inferSyncedObjectType } from "./inference.ts";
import { AnyAccessor, SyncedObjectInfo } from "./object.ts";
import type {
  SyncedObjectConstructor,
  SyncedObjectContainer,
  SyncedObjectRegistry,
} from "./registry.ts";

// deno-lint-ignore no-explicit-any
type SyncedObjectTarget = Uint8Array | any[] | object;

interface DecoratedSyncedObjectDescriptor {
  field: string;
  type: SyncedObjectConstructor;
  description?: string;
  default?: unknown;
  access: AnyAccessor;
}

const decoratedSyncedObjectsField = Symbol();

export type SyncDecoratorOpts = {
  type?: SyncedObjectConstructor; // TODO: type markers (registry lookup)
  description?: string;
};

export function sync<Container extends Entity | Behavior, Field extends SyncedObjectTarget>(
  opts: SyncDecoratorOpts = {},
): (_: undefined, ctx: ClassFieldDecoratorContext<Container, Field>) => void {
  return (_, ctx) => {
    const field = ctx.name;
    if (typeof field !== "string") return;

    if (ctx.static) return;
    if (ctx.private) throw new Error("can't sync a private field!");

    ctx.addInitializer(function () {
      const value = ctx.access.get(this);

      let type = opts.type;
      if (!type) {
        type = inferSyncedObjectType(value);
      }

      let decoratedObjects: DecoratedSyncedObjectDescriptor[];
      if (!(decoratedSyncedObjectsField in this)) {
        decoratedObjects = [];
        Object.defineProperty(this, decoratedSyncedObjectsField, {
          value: decoratedObjects,
          enumerable: false,
        });
      } else {
        decoratedObjects = this[
          decoratedSyncedObjectsField
        ] as DecoratedSyncedObjectDescriptor[];
      }

      decoratedObjects.push({
        field,
        type,
        description: opts.description,
        default: value,
        access: ctx.access,
      });
    });
  };
}

export function setupSyncedObjects(
  registry: SyncedObjectRegistry,
  container: SyncedObjectContainer,
  overrides: Partial<Record<string, SyncedObjectInfo>>,
): void {
  if (!(decoratedSyncedObjectsField in container)) return;

  const descriptors = container[
    decoratedSyncedObjectsField
  ] as DecoratedSyncedObjectDescriptor[];

  for (const descriptor of descriptors) {
    const syncedObject = new descriptor.type(
      registry,
      descriptor.field,
      container,
      descriptor.access,
    );

    const override = overrides[descriptor.field];
    if (override && override.kind === descriptor.type.kind) {
      syncedObject.clock = override.clock;
      const value = override.net
        ? syncedObject.deserializeForNetwork(override.value)
        : syncedObject.deserialize(override.value as JsonValue);
      syncedObject.setup(value);
    } else {
      syncedObject.setup(descriptor.default);
    }
  }
}
