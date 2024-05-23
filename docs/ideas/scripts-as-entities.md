---
title: Scripts as Entities
---

Imagine a Script ([or LocalScript](./scripts-vs-local-scripts.md)) as some Entity that has a single property: the `world://` source code URL

When a Script entity loads in the tree, it loads the linked file as an ES Module and runs the `init` function.

This way, you can put a Script entity as the child of any Entity whose behavior you want to change.

e.g:

```typescript filename="set-x-25.ts"
const init = (game: Game, script: ScriptEntity) => {
  script.parent.transform.y = 25.0
}
```

```
Rigidbody {
  name: "MyRigidbody"
  x: 0.0
  y: 0.0
  Script {
    name: "Script.001"
    source: "world//set-y-25.ts
  }
}
```
