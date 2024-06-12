import { FC, useContext, useState, useCallback } from "react";
import { Entity } from "@dreamlab/engine";
import { SelectedEntityContext } from "../context/selected-entity-context.tsx";
import { game } from "../global-game.ts";
import { useForceUpdateOnEntityChange } from "../hooks/force-update-on-change.ts";
import { Panel } from "./ui/panel.tsx";

const EntityEntry: FC<{ entity: Entity; level: number }> = ({ entity, level }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { selectedEntity, setSelectedEntity } = useContext(SelectedEntityContext);

  const iconVal = (entity.constructor as typeof Entity).icon;
  const icon = iconVal ? iconVal : "🌟";

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleEntityClick = useCallback(() => {
    setSelectedEntity(entity);
  }, [entity, setSelectedEntity]);

  return (
    <li key={entity.ref} className="relative">
      {level > 0 && (
        <span
          className="absolute left-2 top-0 h-full border-l-2 border-light-gray dark:border-dark-gray"
          style={{ marginLeft: `${(level - 1) * 16}px` }}
        ></span>
      )}
      <div
        className={`flex items-center cursor-pointer transition-all w-full ${
          selectedEntity === entity
            ? "bg-accent-primaryLight"
            : "hover:bg-accent-secondaryLight dark:hover:bg-accent-secondary"
        } hover:shadow-md`}
        onClick={handleEntityClick}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        {entity.children.size > 0 ? (
          <div className="flex-shrink-0 w-4 pl-1" onClick={toggleCollapse}>
            {isCollapsed ? (
              <i className="fas fa-caret-right"></i>
            ) : (
              <i className="fas fa-caret-down"></i>
            )}
          </div>
        ) : (
          <span className="inline-block w-4"></span>
        )}
        <span
          className={`text-sm ${
            selectedEntity === entity
              ? "font-medium"
              : "text-light-textPrimary dark:text-dark-textPrimary"
          }`}
        >
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
