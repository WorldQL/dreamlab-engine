import { ClientGame } from "@dreamlab/engine";

// TODO: the edited game should have a SceneDescription as the source of truth

export let currentGame: ClientGame;
export function createGame(
  container: HTMLDivElement,
  connectionId: string,
  instanceId: string,
  worldId: string,
): ClientGame {
  return new ClientGame({
    network: {
      connectionId,
      peers: [],
      sendCustomMessage() {},
      broadcastCustomMessage() {},
      onReceiveCustomMessage() {},
    },
    container,
    instanceId,
    worldId,
  });
}

export function setCurrentGame(g: ClientGame) {
  currentGame = g;
}

export let playModeGame: ClientGame;
export function setPlayModeGame(g: ClientGame) {
  playModeGame = g;
}
export let editModeGame: ClientGame;
export function setEditModeGame(g: ClientGame) {
  editModeGame = g;
}

/*
Every edit instance has one to two game objects. One that's always paused, and one that can be played or paused.

The client will have two tabs which switch between Edit Mode and Play Mode.
When switching between them, the entire scene hierarchy is switched to the current instance. Any changes made in Play Mode cannot be saved.
When the editor first start up, only one of these tabs will be available.

When the user presses "Play", a new game is created by serializing the current level and loading it in
on both the client and the server. The Play Mode tab will be lit up and the user can switch to it. When the user presses the "Stop" button, the Play mode tab will become unavailable.

This has some extremely desirable consequences, notably that when multiple people are editing, the edit instance can 
continue to run unencumbered by the currently running game. Users can switch between the Play and Edit tabs at their leisure.


*/