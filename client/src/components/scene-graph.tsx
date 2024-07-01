import { Entity } from "@dreamlab/engine";
import { useAtom } from "jotai";
import { ChevronDownIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { selectedEntityAtom } from "../context/editor-context.tsx";
import { game } from "../global-game.ts";
import { useForceUpdateOnEntityChange } from "../hooks/force-update-on-change.ts";
import { cn } from "../utils/cn.ts";
import { Panel } from "./ui/panel.tsx";
import { SceneMenu } from "./menu/scene-menu.tsx";

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
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState<boolean>(false);

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
      event.dataTransfer.setDragImage(new Image(), 0, 0);
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

      if (!draggedEntity || draggedEntity === entity || draggedEntity.parent === entity) {
        return;
      }

      if (!isDescendant(draggedEntity, entity)) {
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

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      setMenuPosition({ x: event.clientX, y: event.clientY });
      setIsOpen(true);
    },
    [setMenuPosition, setIsOpen],
  );

  return (
    <div>
      <li key={entity.ref}>
        <div
          className={cn(
            "entity-entry flex items-center cursor-pointer w-full relative text-sm text-textPrimary hover:text-white",
            selectedEntity?.id === entity.id && "bg-grey border-primary border-2",
            !isEditing &&
              (isHovered ? "bg-primary hover:shadow-md text-white" : "hover:bg-secondary"),
          )}
          onClick={handleEntityClick}
          onDoubleClick={() => {
            setPreviousName(entity.name);
            setIsEditing(true);
          }}
          draggable={!isEditing}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onContextMenu={handleContextMenu}
          style={{ paddingLeft: `${level * 16}px` }}
        >
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
            <>
              {entity.children.size > 0 ? (
                <div className="flex-shrink-0 w-3 ml-1" onClick={toggleCollapse}>
                  <ChevronDownIcon
                    className={cn(
                      "w-full h-auto transition-transform",
                      isCollapsed && "-rotate-90",
                    )}
                  />
                </div>
              ) : (
                <span className="inline-block w-4"></span>
              )}
              <p>
                {icon} {entity.name}
              </p>
            </>
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
      </li>
      {isOpen && <SceneMenu entity={entity} position={menuPosition} setIsOpen={setIsOpen} />}
    </div>
  );
};

const SceneGraph = () => {
  useForceUpdateOnEntityChange(game.world);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const draggedEntityId = event.dataTransfer.getData("text/plain");
    const draggedEntity = game.entities.lookupById(draggedEntityId);

    if (
      draggedEntity &&
      draggedEntity.parent !== game.world &&
      draggedEntity.parent !== draggedEntity
    ) {
      draggedEntity.parent = game.world;
    }
  }, []);

  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const isEntityClicked = target.closest(".entity-entry");

    if (!isEntityClicked) {
      event.preventDefault();
      setMenuPosition({ x: event.clientX, y: event.clientY });
      setIsOpen(true);
    }
  }, []);

  return (
    <div
      className="h-full z-40"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
    >
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
        {isOpen && (
          <SceneMenu entity={undefined} position={menuPosition} setIsOpen={setIsOpen} />
        )}
      </Panel>
    </div>
  );
};

const SceneGraphMemo = memo(SceneGraph);
export { SceneGraphMemo as SceneGraph };
