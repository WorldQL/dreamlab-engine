// TODO: everything

import type { Behavior, Entity, JsonValue } from "@dreamlab/engine";
import { AnyAccessor } from "./object.ts";
import { SyncedArray, SyncedDeepObject } from "./objects/mod.ts";
import type {
  SyncedObjectConstructor,
  SyncedObjectContainer,
  SyncedObjectRegistry,
} from "./registry.ts";

// deno-lint-ignore no-explicit-any
type SyncedObjectTarget = any[] | object;

interface DecoratedSyncedObjectDescriptor {
  field: string;
  type: SyncedObjectConstructor;
  description?: string;
  default?: unknown;
  access: AnyAccessor;
}

const decoratedSyncedObjectsField = Symbol();

function inferType(value: SyncedObjectTarget): SyncedObjectConstructor {
  if (Array.isArray(value)) return SyncedArray;
  if (typeof value === "object") return SyncedDeepObject;

  throw new Error("unknown type for value! " + JSON.stringify(value));
}

export function sync<Container extends Entity | Behavior, Field extends SyncedObjectTarget>(
  opts: {
    name?: string;
    type?: SyncedObjectConstructor; // TODO: type markers (registry lookup)
    description?: string;
  } = {},
): (_: undefined, ctx: ClassFieldDecoratorContext<Container, Field>) => void {
  return (_, ctx) => {
    if (typeof ctx.name !== "string") return;
    if (ctx.static) return;
    if (ctx.private) throw new Error("can't sync a private field!");

    const field = ctx.name;
    ctx.addInitializer(function () {
      const value = ctx.access.get(this);

      let type = opts.type;
      if (!type) {
        type = inferType(value);
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
  overrides: Partial<
    Record<string, { kind: SyncedObjectConstructor["kind"]; value: JsonValue }>
  >,
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
    const value =
      override && override.kind === descriptor.type.kind
        ? override.value
        : syncedObject.serialize(descriptor.default);

    syncedObject.setup(value);
  }
}
