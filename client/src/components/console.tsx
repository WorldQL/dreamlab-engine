// @deno-types="npm:@types/react@18.3.1"
import { memo } from "react";
import { Panel } from "./ui/panel.tsx";

const Console = () => {
  return (
    <Panel title="Console" className="w-full h-full">
      <div className="p-4">
        <p className="text-textSecondary">Console output will appear here</p>
      </div>
    </Panel>
  );
};

const ConsoleMemo = memo(Console);
export { ConsoleMemo as Console };
