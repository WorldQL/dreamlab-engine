import { ClientGame } from "@dreamlab/engine";

// TODO: the edited game should have a SceneDescription as the source of truth

export let game: ClientGame;
export function createEditorGame(container: HTMLDivElement): ClientGame {
  game = new ClientGame({
    network: {
      connectionId: "[editor]",
      peers: [],
      sendCustomMessage() {},
      broadcastCustomMessage() {},
      onReceiveCustomMessage() {},
    },
    container,
    instanceId: "[editor]",
    worldId: "[editor]",
  });
  return game;
}

// TODO: export let playModeGame: ClientGame | undefined, with play+reset lifecycle
