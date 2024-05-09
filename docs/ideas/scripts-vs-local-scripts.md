---
title: "scripts" vs "local scripts"
author: charlotte
---

the client/server distinction is what we are trying to solve as WorldQL, right? i think the current iteration of dreamlab does this very poorly.

early stage ROBLOX had a solution to this: two instance types, 'Script' and 'LocalScript', contained source code that could be run either exclusively on the server or exclusively on the client.

we can't emulate this model of isolated scripts completely because each roblox script has a separate Lua context: we don't have `ShadowRealm` in Deno (it's not even through TC39 yet) and we really should not be spinning up hundreds of WebWorkers for a game.

i would like to move away from having `client.ts` and `server.ts` as the only entrypoints, instead we can have autoload of everything underneath some directory structure (NOT EVERYTHING!! we need libraries!!) and we can do c/s distinction via `myThing.client.ts` and `myThing.server.ts` à la Garry's Mod

i would also like the module exposed by a script to be more than just `{ init: (game) => void }`
