# editor

experimental next generation editor for dreamlab

- semantic html and vanilla css and vanilla js, driven by game events & html events
- does not use `game.paused` to tell between edit mode and play mode, uses facade entities for camera and rigidbody2d

## left to do

- rebuild + reload behavior scripts when they're edited
- save the scene description to JSON on the server
- undo/redo (this is hard to get right in multiplayer)
- entity def copy paste
- hotkeys

## maybe

- drag-and-drop texture assets onto value fields ?
- keep the scene description separate to the game (?)
  - this lets us persist `scene.registration` (useful for custom entities)
  - we can exclude entities from rendering altogether
  - we do not have to instantiate behaviors at all, meaning we can implement editor logic (camera pan, etcetc) using real ticking behaviors
