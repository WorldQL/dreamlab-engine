import { ClientGame } from "@dreamlab/engine";

// TODO: the edited game should have a SceneDescription as the source of truth

export let game: ClientGame;
export function createEditorGame(
  container: HTMLDivElement,
  instanceId: string,
  worldId: string,
): ClientGame {
  game = new ClientGame({
    network: {
      connectionId: instanceId,
      peers: [],
      sendCustomMessage() {},
      broadcastCustomMessage() {},
      onReceiveCustomMessage() {},
    },
    container,
    instanceId: instanceId,
    worldId: worldId,
  });

  return game;
}

// TODO: export let playModeGame: ClientGame | undefined, with play+reset lifecycle
