import { createRoot } from "react-dom/client";

export const MyComponent = () => (
  <div>
    <p>hello!</p>
    <div id="dreamlab-render"></div>
  </div>
);

export const renderReact = () => {
  const root = createRoot(document.querySelector("#root")!);
  root.render(<MyComponent />);
};
