// @deno-types="npm:@types/react@18.3.1"
import { memo } from "react";

const Console = () => {
  return (
    <div className="w-full h-full">
      <div className="p-4">
        <p className="text-textSecondary">Console output will appear here</p>
      </div>
    </div>
  );
};

const ConsoleMemo = memo(Console);
export { ConsoleMemo as Console };
