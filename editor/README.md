# editor

experimental next generation editor for dreamlab

- semantic html and vanilla css and vanilla js, driven by game events & html events
- does not use `game.paused` to tell between edit mode and play mode, uses facade entities for camera and rigidbody2d
- (TODO) will keep the scene description separate to the game
  - this lets us persist `scene.registration` (useful for custom entities)
  - we can exclude entities from rendering altogether
  - we do not have to instantiate behaviors at all, meaning we can implement editor logic (camera pan, etcetc) using real ticking behaviors

## current feature set (day 1)

- no react, tailwind, etcetc: dist/client-main.js reduced from 1.6 megabytes to 52 kilobytes
- fixed build system: dist/engine.js reduced from 1.8 megabytes to 136 kilobytes

- scene graph view
  - can click and drag to reparent
  - can double click to rename entities
  - can click entities to select them
- properties view
  - shows properties of the currently selected entity
  - can edit name
  - can edit transform (pos / rot / scale)
  - can edit values
- multiplayer edit cursors (just for fun)
  - just sends CustomMessage packets with ur mouse position & renders svgs lol

## missing features

- behavior management
  - technically this is also not working in the current editor
  - when we have the scene description separate we can read information we need out of the scene defs
  - to see what values a behavior has we can load them into a really short-lived dummy game (where they can't touch any state!!) and see what props the js obj has
- script editing
  - i want to do this _in editor_ instead of in an iframe. i think i can manage monaco embedding
- play/pause/stop
  - i just didn't get around to this yet
