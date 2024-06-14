import { FC, useContext, useState, useCallback } from "react";
import { Entity } from "@dreamlab/engine";
import { SelectedEntityContext } from "../context/selected-entity-context.tsx";
import { game } from "../global-game.ts";
import { useForceUpdateOnEntityChange } from "../hooks/force-update-on-change.ts";
import { Panel } from "./ui/panel.tsx";

interface EntityEntryProps {
  entity: Entity;
  level: number;
}

const EntityEntry: FC<EntityEntryProps> = ({ entity, level }: EntityEntryProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { selectedEntity, setSelectedEntity } = useContext(SelectedEntityContext);

  const iconVal = (entity.constructor as typeof Entity).icon;
  const icon = iconVal ? iconVal : "🌟";

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev: boolean) => !prev);
  }, []);

  const handleEntityClick = useCallback(() => {
    setSelectedEntity(entity);
  }, [entity, setSelectedEntity]);

  return (
    <li key={entity.ref} className="relative">
      <div
        className={`flex items-center cursor-pointer w-full relative ${
          selectedEntity === entity ? "bg-gray border-primary border-2" : "hover:bg-secondary"
        } hover:shadow-md`}
        onClick={handleEntityClick}
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
          {[...entity.children.values()].map(e => (
            <EntityEntry entity={e} level={level + 1} key={e.ref} />
          ))}
        </ul>
      )}
    </li>
  );
};

export const SceneGraph: FC = () => {
  useForceUpdateOnEntityChange(game.world);

  return (
    <Panel title="Scene" className="h-full">
      <div>
        <ul>
          {[...game.world.children.values()].map(ent => (
            <EntityEntry entity={ent} level={0} key={ent.ref} />
          ))}
        </ul>
      </div>
    </Panel>
  );
};

export default SceneGraph;
