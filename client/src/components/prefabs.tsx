import { FC } from "react-jsx/jsx-runtime";

// placeholder until its fully implemented
export const Prefabs: FC = () => {
  return (
    <div className="bg-light-cardBackground border border-4 border-light-gray dark:border-dark-gray rounded-lg shadow-md dark:bg-dark-cardBackground h-full">
      <div className="flex items-center justify-between p-2 bg-light-gray dark:bg-dark-gray rounded-t-lg shadow-sm">
        <h2 className="text-lg font-semibold text-light-textPrimary dark:text-dark-textPrimary">
          Prefabs
        </h2>
      </div>
      <div className="p-1">
        <ul>
          {/* TODO: Replace with actual logic to display prefabs */}
          {/* {[...game.world.prefabs.values()].map(ent => (
              <PrefabEntry entity={ent} level={0} key={ent.ref} />
            ))} */}
        </ul>
      </div>
    </div>
  );
};

export default Prefabs;
