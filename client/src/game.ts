import { ClientGame } from "@dreamlab/engine";

// TODO: the edited game should have a SceneDescription as the source of truth

export let game: ClientGame;
export function createEditorGame(container: HTMLDivElement): ClientGame {
  game = new ClientGame({
    connectionId: "00000000-0000-0000-0000-000000000000",
    container,
    instanceId: "[editor]",
    worldId: "[editor]",
  });
  return game;
}

// TODO: export let playModeGame: ClientGame | undefined, with play+reset lifecycle
