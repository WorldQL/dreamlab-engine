import { Entity } from "@dreamlab/engine";
import { useAtom } from "jotai";
import { ChevronDownIcon } from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";
import { selectedEntityAtom } from "../context/editor-context.tsx";
import { game } from "../global-game.ts";
import { useForceUpdateOnEntityChange } from "../hooks/force-update-on-change.ts";
import { cn } from "../utils/cn.ts";
import { Panel } from "./ui/panel.tsx";

const isDescendant = (parent: Entity, child: Entity): boolean => {
  if (parent === child) {
    return true;
  }
  for (const childEntity of parent.children.values()) {
    if (isDescendant(childEntity, child)) {
      return true;
    }
  }
  return false;
};

const EntityEntry = ({
  entity,
  level,
}: {
  readonly entity: Entity;
  readonly level: number;
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useAtom(selectedEntityAtom);
  const [previousName, setPreviousName] = useState<string>(entity.name);
  const dragImageRef = useRef<HTMLDivElement>(null);

  const iconVal = (entity.constructor as typeof Entity).icon;
  const icon = iconVal ? iconVal : "🌟";

  const toggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), []);

  const handleEntityClick = useCallback(
    () => setSelectedEntity(entity),
    [entity, setSelectedEntity],
  );

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.dataTransfer.setData("text/plain", entity.id);
      const dragImage = dragImageRef.current;
      if (dragImage) {
        event.dataTransfer.setDragImage(dragImage, -10, 10);
      }
    },
    [entity],
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHovered(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHovered(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsHovered(false);
      const draggedEntityId = event.dataTransfer.getData("text/plain");
      const draggedEntity = game.entities.lookupById(draggedEntityId);

      if (draggedEntity && draggedEntity !== entity && !isDescendant(draggedEntity, entity)) {
        draggedEntity.parent = entity;
      }
    },
    [entity],
  );

  const handleNameBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const newName = e.target.value.trim();
      if (newName !== "") {
        entity.name = newName;
        setSelectedEntity(entity);
      } else {
        entity.name = previousName;
      }
      setIsEditing(false);
    },
    [entity, previousName, setSelectedEntity],
  );

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const newName = (e.target as HTMLInputElement).value.trim();
        if (newName !== "") {
          entity.name = newName;
          setSelectedEntity(entity);
        } else {
          entity.name = previousName;
        }
        setIsEditing(false);
      } else if (e.key === "Escape") {
        entity.name = previousName;
        setIsEditing(false);
      }
    },
    [entity, previousName, setSelectedEntity],
  );

  return (
    <li key={entity.ref} className="relative">
      <div
        className={cn(
          "flex items-center cursor-pointer w-full relative",
          selectedEntity?.id === entity.id && "bg-grey ring-primary ring-2 rounded",
          !isEditing && (isHovered ? "bg-primary hover:shadow-md" : "hover:bg-secondary"),
        )}
        onClick={handleEntityClick}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        {entity.children.size > 0 ? (
          <div className="flex-shrink-0 w-3 ml-1 text-icon" onClick={toggleCollapse}>
            <ChevronDownIcon
              className={cn("w-full h-auto transition-transform", isCollapsed && "-rotate-90")}
            />
          </div>
        ) : (
          <span className="inline-block w-4"></span>
        )}
        {isEditing ? (
          <input
            type="text"
            defaultValue={entity.name}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            autoFocus
            className="text-sm text-textPrimary w-full px-1 outline-none bg-transparent"
            style={{ marginLeft: `${level * 16}px` }}
          />
        ) : (
          <span
            className="text-sm text-textPrimary"
            onDoubleClick={() => {
              setPreviousName(entity.name);
              setIsEditing(true);
            }}
          >
            {icon} {entity.name}
          </span>
        )}
      </div>
      {entity.children.size > 0 && !isCollapsed && (
        <ul>
          {[...entity.children.entries()]
            .toSorted(([aName, _a], [bName, _b]) => aName.localeCompare(bName))
            .map(([_, e]) => (
              <EntityEntry entity={e} level={level + 1} key={e.ref} />
            ))}
        </ul>
      )}
      {/* FIXME: this is always hidden */}
      <div
        ref={dragImageRef}
        className="hidden bg-primaryLight text-white border border-primary rounded px-2 py-1"
      >
        {entity.name}
      </div>
    </li>
  );
};

const SceneGraph = () => {
  useForceUpdateOnEntityChange(game.world);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const draggedEntityId = event.dataTransfer.getData("text/plain");
    const draggedEntity = game.entities.lookupById(draggedEntityId);

    if (draggedEntity) {
      draggedEntity.parent = game.world;
    }
  }, []);

  return (
    <div className="h-full" onDragOver={handleDragOver} onDrop={handleDrop}>
      <Panel className="h-full" title="Scene">
        <div>
          <ul>
            {[...game.world.children.entries()]
              .toSorted(([aName, _a], [bName, _b]) => aName.localeCompare(bName))
              .map(([_, ent]) => (
                <EntityEntry entity={ent} level={0} key={ent.ref} />
              ))}
          </ul>
        </div>
      </Panel>
    </div>
  );
};

const SceneGraphMemo = memo(SceneGraph);
export { SceneGraphMemo as SceneGraph };
