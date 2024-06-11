import { FC, useContext } from "react-jsx/jsx-runtime";
import { SelectedEntityContext } from "../context/selected-entity-context.tsx";

export const Inspector: FC = () => {
  const { selectedEntity } = useContext(SelectedEntityContext);

  if (!selectedEntity) {
    return (
      <div className="bg-light-cardBackground border border-4 border-light-gray dark:border-dark-gray rounded-lg shadow-md dark:bg-dark-cardBackground h-full">
        <div className="flex items-center justify-between p-2 bg-light-gray dark:bg-dark-gray rounded-t-lg shadow-sm">
          <h2 className="text-lg font-semibold text-light-textPrimary dark:text-dark-textPrimary">
            Inspector
          </h2>
        </div>
        <div className="p-4">
          <p className="text-light-textSecondary dark:text-dark-textSecondary">
            No entity selected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light-cardBackground border border-4 border-light-gray dark:border-dark-gray rounded-lg shadow-md dark:bg-dark-cardBackground h-full">
      <div className="flex items-center justify-between p-2 bg-light-gray dark:bg-dark-gray rounded-t-lg shadow-sm">
        <h2 className="text-lg font-semibold text-light-textPrimary dark:text-dark-textPrimary">
          Inspector
        </h2>
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2 text-light-textPrimary dark:text-dark-textPrimary">
          {selectedEntity.name}
        </h3>
        <div className="mb-4">
          <p
            className="text-xs text-light-textSecondary dark:text-dark-textSecondary"
            style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            ID: {selectedEntity.ref}
          </p>
          <p className="text-sm text-light-textSecondary dark:text-dark-textSecondary">
            Type: {selectedEntity.constructor.name}
          </p>
        </div>
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2 text-light-textPrimary dark:text-dark-textPrimary">
            Transform
          </h4>
          <p className="text-light-textSecondary dark:text-dark-textSecondary">
            Position: ({selectedEntity.transform.position.x},{" "}
            {selectedEntity.transform.position.y})
          </p>
          <p className="text-light-textSecondary dark:text-dark-textSecondary">
            Rotation: {selectedEntity.transform.rotation}
          </p>
          <p className="text-light-textSecondary dark:text-dark-textSecondary">
            Scale: ({selectedEntity.transform.scale.x}, {selectedEntity.transform.scale.y})
          </p>
        </div>
      </div>
    </div>
  );
};

export default Inspector;
