---
title: the entity tree
author: charlotte
---

for this document, disregard the notion of what 'entity' and 'spawnable entity' mean in the current iteration of Dreamlab.

an "Entity" can be an object in the world, a script, a containing group, or something else -- it is just something that exists in the tree. think Godot 'Nodes' or Unity 'GameObjects'

## entity IDs are human-readable paths

at the moment, we use uids to identify entities. these are great for programming without thinking about an entity hierarchy, but not human readable to find in log output (e.g. which entity is `6en0lsutc8b70zzd66os5ioa` ????).

instead, I think we should store an entity 'name' (e.g. `"BouncyBall"`) and derive its 'full id' (aka 'entity id', e.g. `game.world["My Group"]["BouncyBall"]`) by traversing down from the root of the tree through parents and ancestors (see: Blender).

**NB:** names underneath some entity must be unique. we can either do what Blender does and append numbers automatically on `spawn(..)` if there's a conflict (e.g. a second "BouncyBall" becomes "BouncyBall.002"), relax this constraint (but it will break entity lookups by name) or do something else

- implementation detail: we will still need random unique identifiers to refer to entities ("entity uid") for netcode purposes. for example, if you're spawning an entity from the client and its name is already occupied, the server will auto-rename it with a ".N" disambiguator and send you a packet back that says 'the entity you just spawned got renamed'. BUT if you spawn like five entities and that response comes back you need to know which entity that refers to. plus, referring to entities via an internal uid means we do less tree traversal when looking them up
- implementation detail: we memoize the full entity ID and update it when the hierarchy changes, so that we aren't doing tree climbing algorithms all the time

## the tree roots

there are four places entities can live, which affects their behavior:
- `game.world` (shared): Contains entities that exist on both the client and the server
- `game.remote` (? name tbd): (server-only) Contains scripts for server-only processing. e.g. gamemode code
- `game.local` (? name tbd): (client-only) Contains scripts for client-only processing. e.g. client UI code
- `game.prefabs`: Contains unevaluated prefabs. These entities are not shown in the world & scripts are never evaluated here. More on prefabs later

we can then reimagine some existing systems using this new model:

- a player connecting to the server spawns a `NetConnection` in `game.remote.players` and a `PlayerController` in `game.world`. a NetConnection can store the connection ID / player ID / nickname / etc etc and a PlayerController can have a default locomotion system and have health, etc etc. useful. the player controller spawned can even be custom, determined by some 'player joined' event
- you can build a house out of sprites and stuff in the editor (maybe even throw in a working door entity!). then group it up and throw the group in `game.prefabs`:  it won't do any physics or execute any code until you move (or copy) it out of prefabs and into the world
- TODO: more examples of systems
