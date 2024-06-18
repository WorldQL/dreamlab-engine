import { EntityTransformUpdate, EntityValues } from "@dreamlab/engine";
import { memo, useCallback, useContext, useEffect, useState } from "react";
import { EditorContext } from "../context/editor-context.tsx";
import { AxisInputField } from "./ui/axis-input.tsx";
import { InputField } from "./ui/input.tsx";
import { Panel } from "./ui/panel.tsx";

const Inspector = () => {
  const { selectedEntity, setSelectedEntity } = useContext(EditorContext);

  const [name, setName] = useState<string>("");
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [globalPosition, setGlobalPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [rotation, setRotation] = useState<number>(0);
  const [globalRotation, setGlobalRotation] = useState<number>(0);
  const [scale, setScale] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  const [values, setValues] = useState<EntityValues>({} as EntityValues);
  const [behaviors, setBehaviors] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedEntity) return;

    const entity = selectedEntity;
    const updateValues = () => {
      setName(entity.name);
      setPosition(entity.transform.position);
      setGlobalPosition(entity.globalTransform.position);
      setRotation(entity.transform.rotation * (180 / Math.PI));
      setGlobalRotation(entity.globalTransform.rotation * (180 / Math.PI));
      setScale(entity.transform.scale);
      setValues(entity.values);
      setBehaviors(entity.behaviors.map(behavior => behavior.constructor.name));
    };
    updateValues();
    entity.on(EntityTransformUpdate, updateValues);
    return () => entity.unregister(EntityTransformUpdate, updateValues);
  }, [selectedEntity]);

  const handleNameChange = useCallback(
    (newName: string) => {
      setName(newName);
      if (selectedEntity) {
        selectedEntity.name = newName;
        setSelectedEntity(selectedEntity);
      }
    },
    [selectedEntity, setName, setSelectedEntity],
  );

  const handlePositionChange = useCallback(
    (axis: "x" | "y", value: number) => {
      const newPosition = { x: position.x, y: position.y, [axis]: value };
      setPosition(newPosition);
      if (selectedEntity) {
        selectedEntity.transform.position = newPosition;
        setSelectedEntity(selectedEntity);
      }
    },
    [selectedEntity, setPosition, setSelectedEntity],
  );

  const handlePositionChangeX = useCallback(
    (value: number) => handlePositionChange("x", value),
    [handlePositionChange],
  );
  const handlePositionChangeY = useCallback(
    (value: number) => handlePositionChange("y", value),
    [handlePositionChange],
  );

  const handleRotationChange = useCallback(
    (newRotation: number) => {
      setRotation(newRotation);
      if (selectedEntity) {
        const rotationInRadians = newRotation * (Math.PI / 180);
        selectedEntity.transform.rotation = rotationInRadians;
        setSelectedEntity(selectedEntity);
      }
    },
    [selectedEntity, setRotation, setSelectedEntity],
  );

  const handleScaleChange = useCallback(
    (axis: "x" | "y", value: number) => {
      const newScale = { x: scale.x, y: scale.y, [axis]: value };
      setScale(newScale);
      if (selectedEntity) {
        selectedEntity.transform.scale = newScale;
        setSelectedEntity(selectedEntity);
      }
    },
    [selectedEntity, setScale, setSelectedEntity],
  );

  const handleScaleChangeX = useCallback(
    (value: number) => handleScaleChange("x", value),
    [handleScaleChange],
  );
  const handleScaleChangeY = useCallback(
    (value: number) => handleScaleChange("y", value),
    [handleScaleChange],
  );

  const handleValueChange = (key: string) => (newValue: string) => {
    const newValues = Object.assign({}, values, { [key]: newValue });
    setValues(newValues);
    if (selectedEntity) {
      selectedEntity.set({ values: newValues });
      setSelectedEntity(selectedEntity);
    }
  };

  if (!selectedEntity) {
    return (
      <Panel className="h-full" title="Inspector">
        <div className="p-4">
          <p className="text-textSecondary">No entity selected</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="h-full" title="Inspector">
      <div className="p-4">
        <div className="mb-4">
          <InputField type="text" label="Name" value={name} onChange={handleNameChange} />
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-2 text-textPrimary">Transform</h4>
          <div className="mb-2">
            <label className="block text-sm font-medium text-textPrimary">Position</label>
            <div className="flex space-x-2">
              <AxisInputField axis="x" value={position.x} onChange={handlePositionChangeX} />
              <AxisInputField axis="y" value={position.y} onChange={handlePositionChangeY} />
            </div>
          </div>
          <div className="text-textSecondary text-xs mb-4">
            Global pos: {globalPosition.x}, {globalPosition.y}
          </div>

          <InputField
            label="Rotation"
            type="number"
            value={rotation}
            onChange={handleRotationChange}
          />
          <div className="text-textSecondary text-xs mb-4">
            Global rotation: {globalRotation}
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-textPrimary">Scale</label>
            <div className="flex space-x-2">
              <AxisInputField axis="x" value={scale.x} onChange={handleScaleChangeX} />
              <AxisInputField axis="y" value={scale.y} onChange={handleScaleChangeY} />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2 text-textPrimary">Values</h4>
          {Object.keys(values).map(key => (
            <InputField
              type="text"
              key={key}
              label={key}
              value={String(values[key as keyof EntityValues])}
              onChange={handleValueChange(key as keyof EntityValues)}
            />
          ))}
        </div>
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2 text-textPrimary">Behaviors</h4>
          {behaviors.map((behavior, index: number) => (
            <div key={index} className="mb-2">
              <p className="text-sm font-medium text-textPrimary">{behavior}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};

const InspectorMemo = memo(Inspector);
export { InspectorMemo as Inspector };
