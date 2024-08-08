import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// @deno-types="npm:@types/react@18.3.1"
import { StrictMode } from "react";
// @deno-types="npm:@types/react-dom@18.3/client"
import { createRoot } from "react-dom/client";
import { EditorLayout } from "./components/editor-layout.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import { ModalProvider } from "./context/modal-context.tsx";
import { ClientGame } from "@dreamlab/engine";
import { GameContext } from "./context/game-context.ts";

const queryClient = new QueryClient();

export const renderEditorUI = (
  editGame: ClientGame,
  editModeGameDiv: HTMLDivElement,
  playModeGameDiv: HTMLDivElement,
) => {
  const root = createRoot(document.querySelector("#root")!);
  root.render(
    <StrictMode>
      <GameContext.Provider value={editGame}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            <ModalProvider>
              <EditorLayout
                editModeGameDiv={editModeGameDiv}
                playModeGameDiv={playModeGameDiv}
              />
            </ModalProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </GameContext.Provider>
    </StrictMode>,
  );
};
