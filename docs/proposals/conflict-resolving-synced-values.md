---
title: conflict-resolving synced values
author: charlotte
---

a network primitive we could work with are _synced values_. these store some state that is replicated & synchronized between the server and every client. any client can change a synced value at any time.

## Mechanics

synced values need to track three things:

- the value itself
- generation ID (sequential counter)
- source (connection ID OR undefined as a sentinel to mean 'the server')

conflicting values must be resolved deterministically. whichever peer "wins" gets to dictate the value:

- whoever has the highest generation wins
- if the generations are the same, whoever has the 'lowest' connection ID wins (server always wins)

values contained in a 'synced value' are not internally mutable.

all of this can mostly be handled by one packet:

```typescript
// C->S, S->C
export interface SetSyncedValuePacket {
  t: "SetSyncedValue";
  entityId: string;
  key: string;
  value: Jsonifiable;
  generation: number; // or numeric string? for a snowflake value?
  setBy: string | undefined;
}
```

## User-facing API

TODO. but we can keep `syncedValue<T>(owner, name, default: T)` too. it works very well already if `T` is primitive. maybe `owner` should be any object instead of a uid though (e.g. passing in an entity can use its internal uid if we go with [the entity tree proposal](./entity-tree.md))
