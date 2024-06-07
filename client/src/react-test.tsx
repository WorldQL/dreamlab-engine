import { createRoot } from "react-dom/client";
import EditorLayout from "./components/editor-layout.tsx";

export const MyComponent = () => (
  <div>
    <p>hello!</p>
  </div>
);

export const renderReact = () => {
  const root = createRoot(document.querySelector("#root")!);
  root.render(<EditorLayout />);
};
