import { FC, useContext, useState, useEffect, ChangeEvent } from "react";
import { SelectedEntityContext } from "../context/selected-entity-context.tsx";
import { AxisInputField } from "./ui/axis-input.tsx";
import { InputField } from "./ui/input.tsx";
import { EntityValues } from "@dreamlab/engine";

export const Inspector: FC = () => {
  const { selectedEntity, setSelectedEntity } = useContext(SelectedEntityContext);

  const [name, setName] = useState<string>("");
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  const [values, setValues] = useState<EntityValues>({} as EntityValues);
  const [behaviors, setBehaviors] = useState<string[]>([]);

  useEffect(() => {
    if (selectedEntity) {
      setName(selectedEntity.name);
      setPosition(selectedEntity.transform.position);
      setRotation(selectedEntity.transform.rotation);
      setScale(selectedEntity.transform.scale);
      setValues(selectedEntity.values);
      setBehaviors(selectedEntity.behaviors.map(behavior => behavior.constructor.name));
    }
  }, [selectedEntity]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (selectedEntity) {
      selectedEntity.name = newName;
      setSelectedEntity(selectedEntity);
    }
  };

  const handlePositionChange = (axis: "x" | "y") => (e: ChangeEvent<HTMLInputElement>) => {
    const newPosition = { ...position, [axis]: parseFloat(e.target.value) };
    setPosition(newPosition);
    if (selectedEntity) {
      selectedEntity.transform.position = newPosition;
      setSelectedEntity(selectedEntity);
    }
  };

  const handleRotationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newRotation = parseFloat(e.target.value);
    setRotation(newRotation);
    if (selectedEntity) {
      selectedEntity.transform.rotation = newRotation;
      setSelectedEntity(selectedEntity);
    }
  };

  const handleScaleChange = (axis: "x" | "y") => (e: ChangeEvent<HTMLInputElement>) => {
    const newScale = { ...scale, [axis]: parseFloat(e.target.value) };
    setScale(newScale);
    if (selectedEntity) {
      selectedEntity.transform.scale = newScale;
      setSelectedEntity(selectedEntity);
    }
  };

  const handleValueChange = (key: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newValues = Object.assign({}, values, { [key]: newValue });
    setValues(newValues);
    if (selectedEntity) {
      selectedEntity.set({ values: newValues });
      setSelectedEntity(selectedEntity);
    }
  };

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
        <div className="mb-4">
          <InputField label="Name" value={name} onChange={handleNameChange} />
        </div>
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2 text-light-textPrimary dark:text-dark-textPrimary">
            Transform
          </h4>
          <div className="mb-2">
            <label className="block text-sm font-medium text-light-textPrimary dark:text-dark-textPrimary">
              Position
            </label>
            <div className="flex space-x-2">
              <AxisInputField
                axis="x"
                value={position.x}
                onChange={handlePositionChange("x")}
              />
              <AxisInputField
                axis="y"
                value={position.y}
                onChange={handlePositionChange("y")}
              />
            </div>
          </div>
          <InputField
            label="Rotation"
            type="number"
            value={rotation}
            onChange={handleRotationChange}
          />
          <div className="mb-2">
            <label className="block text-sm font-medium text-light-textPrimary dark:text-dark-textPrimary">
              Scale
            </label>
            <div className="flex space-x-2">
              <AxisInputField axis="x" value={scale.x} onChange={handleScaleChange("x")} />
              <AxisInputField axis="y" value={scale.y} onChange={handleScaleChange("y")} />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2 text-light-textPrimary dark:text-dark-textPrimary">
            Values
          </h4>
          {Object.keys(values).map(key => (
            <InputField
              key={key}
              label={key}
              value={String(values[key as keyof EntityValues])}
              onChange={handleValueChange(key as keyof EntityValues)}
            />
          ))}
        </div>
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2 text-light-textPrimary dark:text-dark-textPrimary">
            Behaviors
          </h4>
          {behaviors.map((behavior, index) => (
            <div key={index} className="mb-2">
              <p className="text-sm font-medium text-light-textPrimary dark:text-dark-textPrimary">
                {behavior}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
