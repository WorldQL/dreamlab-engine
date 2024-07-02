// @deno-types="npm:@types/react@18.3.1"
import { memo } from "react";
import { Panel } from "./ui/panel.tsx";

// placeholder until its fully implemented
const Prefabs = () => {
  return (
    <Panel title="Prefabs" className="h-full">
      <div className="p-1">
        <ul>
          {/* TODO: Replace with actual logic to display prefabs */}
          {/* {[...game.world.prefabs.values()].map(ent => (
              <PrefabEntry entity={ent} level={0} key={ent.ref} />
            ))} */}
        </ul>
      </div>
    </Panel>
  );
};

const PrefabsMemo = memo(Prefabs);
export { PrefabsMemo as Prefabs };
