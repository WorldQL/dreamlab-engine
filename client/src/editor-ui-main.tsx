import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EditorLayout } from "./components/editor-layout.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";

export const renderEditorUI = (gameDiv: HTMLDivElement) => {
  const root = createRoot(document.querySelector("#root")!);
  root.render(
    <StrictMode>
      <TooltipProvider delayDuration={200}>
        <EditorLayout gameDiv={gameDiv} />
      </TooltipProvider>
    </StrictMode>,
  );
};
