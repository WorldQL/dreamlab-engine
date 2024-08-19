# editor

experimental next generation editor for dreamlab

- semantic html and vanilla css and vanilla js, driven by game events & html events
- does not use `game.paused` to tell between edit mode and play mode, uses facade entities for camera and rigidbody2d

## left to do

- play / pause / stop properly working
  - need to add server support for stopping the current play session
- save the scene description to JSON on the server
- gizmo tool selector strip
- project file explorer
  - maybe the scene graph renderer styles can be abstracted to a `TreeView` webcomponent
  - drag-and-drop behavior sourcefiles / texture assets onto value fields
- align design more with original editor (put colors in more places)
- undo/redo (this is hard to get right in multiplayer)
- entity def copy paste
- hotkeys

## maybe

- keep the scene description separate to the game (?)
  - this lets us persist `scene.registration` (useful for custom entities)
  - we can exclude entities from rendering altogether
  - we do not have to instantiate behaviors at all, meaning we can implement editor logic (camera pan, etcetc) using real ticking behaviors
