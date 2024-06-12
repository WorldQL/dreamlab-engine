import { type FC } from "react";
import { Panel } from "./ui/panel.tsx";

export const Console: FC = () => {
  return (
    <Panel title="Console" className="w-full">
      <div className="p-4">
        <p className="text-light-textSecondary dark:text-dark-textSecondary">
          Console output will appear here
        </p>
      </div>
    </Panel>
  );
};

export default Console;
