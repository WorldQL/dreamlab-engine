import { FC, useContext, useState, useCallback, useRef } from "react";
import { Entity } from "@dreamlab/engine";
import { EditorContext } from "../context/editor-context.tsx";
import { game } from "../global-game.ts";
import { useForceUpdateOnEntityChange } from "../hooks/force-update-on-change.ts";
import { Panel } from "./ui/panel.tsx";

interface EntityEntryProps {
  entity: Entity;
  level: number;
}

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

const EntityEntry: FC<EntityEntryProps> = ({ entity, level }: EntityEntryProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { selectedEntity, setSelectedEntity } = useContext(EditorContext);
  const dragImageRef = useRef<HTMLDivElement>(null);

  const iconVal = (entity.constructor as typeof Entity).icon;
  const icon = iconVal ? iconVal : "🌟";

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev: boolean) => !prev);
  }, []);

  const handleEntityClick = useCallback(() => {
    setSelectedEntity(entity);
  }, [entity, setSelectedEntity]);

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

  const getBackgroundClass = () => {
    if (isHovered) {
      return "bg-primary";
    } else {
      return "hover:bg-secondary";
    }
  };

  return (
    <li key={entity.ref} className="relative">
      <div
        className={`flex items-center cursor-pointer w-full relative ${
          selectedEntity === entity ? "bg-gray border-primary border-2" : ""
        } ${getBackgroundClass()} hover:shadow-md`}
        onClick={handleEntityClick}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        {entity.children.size > 0 ? (
          <div className="flex-shrink-0 w-4 pl-1 text-icon" onClick={toggleCollapse}>
            {isCollapsed ? (
              <i className="fas fa-caret-right"></i>
            ) : (
              <i className="fas fa-caret-down"></i>
            )}
          </div>
        ) : (
          <span className="inline-block w-4"></span>
        )}
        <span className="text-sm text-textPrimary">
          {icon} {entity.name}
        </span>
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

export const SceneGraph: FC = () => {
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

export default SceneGraph;
