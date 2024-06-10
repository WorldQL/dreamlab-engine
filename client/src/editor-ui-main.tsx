import { createRoot } from "react-dom/client";
import EditorLayout from "./components/editor-layout.tsx";

export const renderEditorUI = (gameDiv: HTMLDivElement) => {
  const root = createRoot(document.querySelector("#root")!);
  root.render(<EditorLayout gameDiv={gameDiv} />);
};
