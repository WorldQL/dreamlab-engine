import { FC, useContext } from "react-jsx/jsx-runtime";
import { SelectedEntityContext } from "../context/selected-entity-context.tsx";

export const Inspector: FC = () => {
  const { selectedEntity } = useContext(SelectedEntityContext);

  if (!selectedEntity) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Inspector</h2>
        <p>No entity selected</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Inspector</h2>
      <div>
        <h3 className="text-xl font-semibold mb-2">{selectedEntity.name}</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-500">Entity ID: {selectedEntity.ref}</p>
          <p className="text-sm text-gray-500">Type: {selectedEntity.constructor.name}</p>
        </div>
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">Transform</h4>
          <p>
            Position: ({selectedEntity.transform.position.x},{" "}
            {selectedEntity.transform.position.y})
          </p>
          <p>Rotation: {selectedEntity.transform.rotation}</p>
          <p>
            Scale: ({selectedEntity.transform.scale.x}, {selectedEntity.transform.scale.y})
          </p>
        </div>
      </div>
    </div>
  );
};
