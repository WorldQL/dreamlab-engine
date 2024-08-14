import {
  Behavior,
  BoxResizeGizmo,
  Click,
  EntityDescendantRenamed,
  EntityRenamed,
  EntityTransformUpdate,
  Gizmo,
  SpritesheetAdapter,
  TextureAdapter,
  Value,
} from "@dreamlab/engine";
import { useAtom } from "jotai";
import {
  Asterisk,
  CirclePlus,
  ClipboardCopy,
  PieChart,
  Rotate3D,
  Route,
  ShieldQuestion,
} from "lucide-react";
// @deno-types="npm:@types/react@18.3.1"
import { memo, useCallback, useEffect, useState } from "react";
import { selectedEntityAtom } from "../context/editor-context.tsx";
import { useModal } from "../context/modal-context.tsx";
import { useFiles } from "../hooks/useFiles.ts";
import { AxisInputField } from "./ui/axis-input.tsx";
import { InputField } from "./ui/input.tsx";
import { Category } from "./ui/panel.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip.tsx";
import { useGame } from "../context/game-context.ts";
import { z } from "@dreamlab/vendor/zod.ts";

const Inspector = () => {
  const game = useGame();
  const [selectedEntity, setSelectedEntity] = useAtom(selectedEntityAtom);

  const [name, setName] = useState<string>("");
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [globalPosition, setGlobalPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [rotation, setRotation] = useState<number>(0);
  const [globalRotation, setGlobalRotation] = useState<number>(0);
  const [scale, setScale] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  const [values, setValues] = useState<Record<string, Value<unknown>>>({});
  const [behaviors, setBehaviors] = useState<string[]>([]);
  const [behaviorValues, setBehaviorValues] = useState<
    Partial<Record<string, Partial<Record<string, Value<unknown>>>>>
  >({});
  const { openModal, closeModal } = useModal();

  const { data, isLoading, isError } = useFiles(game.instanceId);

  const [copied, setCopied] = useState(false);
  const entityId =
    "game." + selectedEntity?.id?.substring("game.world._.EditEntities._.".length);

  const handleCopy = () => {
    navigator.clipboard.writeText(entityId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onClick = useCallback(
    ({ cursor }: Click) => {
      // FIXME(Charlotte): sprites dont update when game.paused so i made game not paused
      // if (!game.paused) return;

      // Ignore click event if mouse is over a local entity (clickable for gizmo)
      const local = game.local.entities.lookupByPosition(cursor.world);
      if (local.length > 0) return;

      const q = game.world.entities
        .lookupByPosition(cursor.world)
        .toSorted((a, b) => b.z - a.z);

      const gizmo = game.local.children.get("Gizmo")?.cast(Gizmo);
      const boxresize = game.local.children.get("BoxResizeGizmo")?.cast(BoxResizeGizmo);

      const first = q.at(0);
      if (!first) {
        setSelectedEntity(null);
        if (gizmo) gizmo.target = undefined;
        if (boxresize) boxresize.target = undefined;
        return;
      }

      setSelectedEntity(first);
      if (gizmo) gizmo.target = first;
      if (boxresize) boxresize.target = first;
    },
    [game],
  );

  useEffect(() => {
    game.inputs.on(Click, onClick);
    return () => {
      game.inputs.unregister(Click, onClick);
    };
  }, [game, game.paused, onClick]);

  useEffect(() => {
    if (!selectedEntity) return;

    const entity = selectedEntity;
    const updateValues = () => {
      setName(entity.name);
      setPosition({
        x: Math.round(entity.transform.position.x * 10) / 10,
        y: Math.round(entity.transform.position.y * 10) / 10,
      });
      setGlobalPosition({
        x: Math.round(entity.globalTransform.position.x * 10) / 10,
        y: Math.round(entity.globalTransform.position.y * 10) / 10,
      });
      setRotation(Math.round(entity.transform.rotation * (180 / Math.PI) * 10) / 10);
      setGlobalRotation(
        Math.round(entity.globalTransform.rotation * (180 / Math.PI) * 10) / 10,
      );
      setScale({
        x: Math.round(entity.transform.scale.x * 10) / 10,
        y: Math.round(entity.transform.scale.y * 10) / 10,
      });
      setValues(Object.fromEntries(entity.values.entries()));
      setBehaviors(entity.behaviors.map(behavior => behavior.constructor.name));
      const behaviorVals: Partial<Record<string, Partial<Record<string, Value<unknown>>>>> = {};
      entity.behaviors.forEach(behavior => {
        behaviorVals[behavior.constructor.name] = Object.fromEntries(behavior.values.entries());
      });
      setBehaviorValues(behaviorVals);
    };
    updateValues();
    entity.on(EntityTransformUpdate, updateValues);
    entity.on(EntityRenamed, updateValues);
    entity.on(EntityDescendantRenamed, updateValues);
    return () => {
      entity.unregister(EntityTransformUpdate, updateValues);
      entity.unregister(EntityRenamed, updateValues);
      entity.unregister(EntityDescendantRenamed, updateValues);
    };
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
      const newPosition = { x: position.x, y: position.y, [axis]: Math.round(value * 10) / 10 };
      setPosition(newPosition);
      if (selectedEntity) {
        selectedEntity.transform.position = newPosition;
        setSelectedEntity(selectedEntity);
      }
    },
    [selectedEntity, position, setPosition, setSelectedEntity],
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
      const roundedRotation = Math.round(newRotation * 10) / 10;
      setRotation(roundedRotation);
      if (selectedEntity) {
        const rotationInRadians = roundedRotation * (Math.PI / 180);
        selectedEntity.transform.rotation = rotationInRadians;
        setSelectedEntity(selectedEntity);
      }
    },
    [selectedEntity, setRotation, setSelectedEntity],
  );

  const handleScaleChange = useCallback(
    (axis: "x" | "y", value: number) => {
      const newScale = { x: scale.x, y: scale.y, [axis]: Math.round(value * 10) / 10 };
      setScale(newScale);
      if (selectedEntity) {
        selectedEntity.transform.scale = newScale;
        setSelectedEntity(selectedEntity);
      }
    },
    [selectedEntity, scale, setScale, setSelectedEntity],
  );

  const handleScaleChangeX = useCallback(
    (value: number) => handleScaleChange("x", value),
    [handleScaleChange],
  );
  const handleScaleChangeY = useCallback(
    (value: number) => handleScaleChange("y", value),
    [handleScaleChange],
  );

  const handleValueChange =
    (key: string, parser: (v: unknown) => unknown = String) =>
    (newValue: unknown) => {
      setValues(prevValues => {
        const newValues = { ...prevValues };
        if (newValues[key]) {
          newValues[key]!.value = parser(newValue);
        }
        if (selectedEntity) {
          selectedEntity.set({ [key]: parser(newValue) });
          setSelectedEntity(selectedEntity);
        }
        return newValues;
      });
    };

  const updateBehaviorValues = (behavior: Behavior, key: string, newValue: unknown) => {
    const Value = behavior.values.get(key) as Value<unknown>;
    if (!Value) {
      throw new Error(`Property name '${key}' does not exist on Behavior!`);
    }
    Value.value = newValue;
  };

  const handleBehaviorValueChange =
    (behaviorName: string, key: string) => (newValue: string) => {
      setBehaviorValues(prevValues => {
        const newValues = { ...prevValues };
        if (newValues[behaviorName] && newValues[behaviorName]![key]) {
          newValues[behaviorName]![key]!.value = newValue;
        }
        if (selectedEntity) {
          const behavior = selectedEntity.behaviors.find(
            b => b.constructor.name === behaviorName,
          );
          if (behavior) {
            updateBehaviorValues(behavior, key, newValue);
            setSelectedEntity(selectedEntity);
          }
        }
        return newValues;
      });
    };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    let filePath = event.dataTransfer.getData("text/plain");
    if (filePath && selectedEntity) {
      if (filePath.endsWith(".ts")) {
        filePath = filePath.replace(".ts", ".js");
      } else if (filePath.endsWith(".tsx")) {
        filePath = filePath.replace(".tsx", ".jsx");
      }

      try {
        const scriptUrl = `http://127.0.0.1:8000/api/v1/edit/${game.instanceId}/files/${filePath}`;
        try {
          const module = await import(scriptUrl);
          const behavior = module.default;
          selectedEntity.addBehavior({ type: behavior });
          setSelectedEntity(selectedEntity);
          setBehaviors(selectedEntity.behaviors.map(b => b.constructor.name));

          const behaviorVals: Partial<Record<string, Partial<Record<string, Value<unknown>>>>> =
            {};
          selectedEntity.behaviors.forEach(behavior => {
            behaviorVals[behavior.constructor.name] = Object.fromEntries(
              behavior.values.entries(),
            );
          });
          setBehaviorValues(behaviorVals);
        } catch (importError) {
          console.error("Failed to import module from script content:", importError);
        }
      } catch (fetchError) {
        console.error("Failed to fetch or import script content:", fetchError);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleBehaviorSubmit = async (scriptPath: string) => {
    await addBehavior(scriptPath);
    closeModal();
  };

  const showAddBehaviorModal = () => {
    openModal(
      <div>
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-textPrimary">Add Behavior</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="ml-2 cursor-help">
                <Asterisk className="w-4 h-4 text-textPrimary" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                Tip: Drag and drop a file into the inspector window to seamlessly add a behavior
                to your entity.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="mt-2 text-xs text-textSecondary">Select a behavior from a file to add:</p>
        <select
          onChange={e => handleBehaviorSubmit(e.target.value)}
          className="w-full border rounded mt-2"
        >
          <option value="">Select a file...</option>
          {!isLoading && !isError ? (
            data?.files.map((file, index) => (
              <option key={index} value={file} title={file}>
                {file.length > 60 ? `${file.substring(0, 57)}...` : file}
              </option>
            ))
          ) : (
            <option disabled>Loading behaviors...</option>
          )}
        </select>
      </div>,
    );
  };

  const addBehavior = async (scriptPath: string) => {
    try {
      if (scriptPath.endsWith(".ts")) {
        scriptPath = scriptPath.replace(".ts", ".js");
      } else if (scriptPath.endsWith(".tsx")) {
        scriptPath = scriptPath.replace(".tsx", ".jsx");
      }
      const scriptUrl = `http://127.0.0.1:8000/api/v1/edit/${game.instanceId}/files/${scriptPath}`;
      try {
        const module = await import(scriptUrl);
        const behavior = module.default;
        if (selectedEntity) {
          selectedEntity.addBehavior({ type: behavior });
          setSelectedEntity(selectedEntity);
          setBehaviors(selectedEntity.behaviors.map(b => b.constructor.name));

          const behaviorVals: Partial<Record<string, Partial<Record<string, Value<unknown>>>>> =
            {};
          selectedEntity.behaviors.forEach(behavior => {
            behaviorVals[behavior.constructor.name] = Object.fromEntries(
              behavior.values.entries(),
            );
          });
          setBehaviorValues(behaviorVals);
        }
      } catch (importError) {
        console.error("Failed to import module from script content:", importError);
      }
    } catch (fetchError) {
      console.error("Failed to fetch or import script content:", fetchError);
    }
  };

  if (!selectedEntity) {
    return (
      <div className="h-full">
        <div className="p-4">
          <p className="text-textSecondary">No entity selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full" onDrop={handleDrop} onDragOver={handleDragOver}>
      <div className="p-1">
        <InputField type="text" label="Name" value={name} onChange={handleNameChange} />
      </div>
      <div className="mt-4 p-1 mb-2">
        <label className="block text-sm font-medium text-textPrimary">Entity ID</label>
        <div className="relative mt-1 flex items-center">
          <div
            onClick={handleCopy}
            className="text-textPrimary cursor-pointer bg-background px-2 py-1 rounded-md w-full"
          >
            {entityId}
          </div>
          <button
            onClick={handleCopy}
            className="ml-2 p-1 text-icon hover:text-primary focus:outline-none"
            title="Copy Entity ID"
          >
            <ClipboardCopy className="w-5 h-5 hover:text-primary" />
          </button>
        </div>
        {copied && <p className="text-green text-xs mt-1">Copied to clipboard!</p>}
      </div>
      <Category
        title="Transform"
        titleIcon={<Rotate3D className="text-green w-4 h-4" />}
        icons={[
          {
            id: "help",
            element: <ShieldQuestion className="w-4 h-4" />,
            onClick: () => window.open("https://docs.dreamlab.gg/", "_blank"),
            tooltip: "View Transform Docs",
          },
        ]}
      >
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
        <div className="text-textSecondary text-xs mb-4">Global rotation: {globalRotation}</div>

        <div>
          <label className="block text-sm font-medium text-textPrimary">Scale</label>
          <div className="flex space-x-2">
            <AxisInputField axis="x" value={scale.x} onChange={handleScaleChangeX} />
            <AxisInputField axis="y" value={scale.y} onChange={handleScaleChangeY} />
          </div>
        </div>
      </Category>
      <Category
        title="Values"
        titleIcon={<PieChart className="text-primaryLight w-4 h-4" />}
        icons={[
          {
            id: "help",
            element: <ShieldQuestion className="w-4 h-4" />,
            onClick: () => window.open("https://docs.dreamlab.gg/", "_blank"),
            tooltip: "View Values Docs",
          },
        ]}
      >
        {Object.entries(values).map(([key, value], index) =>
          value.typeTag === String ||
          value.typeTag === SpritesheetAdapter ||
          value.typeTag === TextureAdapter ? (
            <InputField
              type="text"
              key={`${key}-${index}`}
              label={key}
              value={String(value.value)}
              onChange={handleValueChange(key, String)}
            />
          ) : value.typeTag === Number ? (
            <InputField
              type="number"
              key={`${key}-${index}`}
              label={key}
              value={Number(value.value)}
              onChange={handleValueChange(key, Number)}
            />
          ) : value.typeTag === Boolean ? (
            <InputField
              type="text"
              key={`${key}-${index}`}
              label={key}
              value={String(value.value)}
              onChange={handleValueChange(key, v =>
                z
                  .union([z.enum(["false", "0"]).transform(() => false), z.string()])
                  .pipe(z.coerce.boolean())
                  .parse(v),
              )}
            />
          ) : (
            <p className="text-yellow font-bold">
              FIXME: Could not render input field for '{key}'
            </p>
          ),
        )}
      </Category>
      <Category
        title="Behaviors"
        titleIcon={<Route className="text-yellow w-4 h-4" />}
        icons={[
          {
            id: "add",
            element: <CirclePlus className="w-4 h-4" />,
            onClick: showAddBehaviorModal,
            tooltip: "Add New Behavior",
          },
          {
            id: "help",
            element: <ShieldQuestion className="w-4 h-4" />,
            onClick: () => window.open("https://docs.dreamlab.gg/", "_blank"),
            tooltip: "View Behavior Docs",
          },
        ]}
      >
        {behaviors.map((behavior, index: number) => (
          <div key={index} className="mb-2">
            <p className="text-sm font-medium text-textPrimary">{behavior}</p>
            <div className="ml-2">
              {Object.keys(behaviorValues[behavior] || {}).map(key => (
                <InputField
                  type="text"
                  key={key}
                  label={key}
                  value={String(behaviorValues[behavior]![key]?.value)}
                  onChange={handleBehaviorValueChange(behavior, key)}
                />
              ))}
            </div>
          </div>
        ))}
      </Category>
    </div>
  );
};

const InspectorMemo = memo(Inspector);
export { InspectorMemo as Inspector };
