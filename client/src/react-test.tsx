// temporary. you get it

import { createRoot } from "react-dom/client";

export const MyComponent = () => <p>hello!</p>;

export const renderReact = () => {
  const root = createRoot(document.querySelector("#ui")!);
  root.render(<MyComponent />);
};
