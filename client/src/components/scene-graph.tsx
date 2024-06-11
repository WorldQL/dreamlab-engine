import { FC, useContext, useState } from "react-jsx/jsx-runtime";
import { Entity } from "@dreamlab/engine";
import { SelectedEntityContext } from "../context/selected-entity-context.tsx";
import { game } from "../global-game.ts";
import { useForceUpdateOnEntityChange } from "../hooks/force-update-on-change.ts";

const EntityEntry: FC<{ entity: Entity; level: number }> = ({ entity, level }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { selectedEntity, setSelectedEntity } = useContext(SelectedEntityContext);

  const iconVal = (entity.constructor as typeof Entity).icon;
  const icon = iconVal ? iconVal : "{icon}";

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleEntityClick = () => {
    setSelectedEntity(entity);
  };

  return (
    <li key={entity.ref} className={`ml-${level * 4} my-1`}>
      <div
        className={`flex items-center p-1 rounded-md cursor-pointer transition-all ${
          selectedEntity === entity
            ? "bg-accent-primaryLight dark:bg-accent-primaryDark"
            : "hover:bg-light-cardBackground dark:hover:bg-dark-cardBackground"
        }`}
        onClick={handleEntityClick}
      >
        <span
          className="mr-2 text-light-textSecondary dark:text-dark-textSecondary"
          onClick={toggleCollapse}
        >
          {entity.children.size > 0 ? (
            isCollapsed ? (
              <i className="fas fa-caret-right"></i>
            ) : (
              <i className="fas fa-caret-down"></i>
            )
          ) : (
            ""
          )}
        </span>
        <span className="text-sm text-light-textPrimary dark:text-dark-textPrimary">
          {icon} {entity.name}
        </span>
      </div>
      {entity.children.size > 0 && !isCollapsed && (
        <ul className="ml-4 mt-1 border-l border-light-textSecondary dark:border-dark-textSecondary">
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
    <div className="bg-light-cardBackground rounded-lg shadow-md dark:bg-dark-cardBackground p-4">
      <h2 className="text-lg font-semibold mb-4 text-light-textPrimary dark:text-dark-textPrimary">
        Scene Graph
      </h2>
      <div className="border border-light-textSecondary rounded-md dark:border-dark-textSecondary p-2">
        <ul className="space-y-1">
          {[...game.world.children.values()].map(ent => (
            <EntityEntry entity={ent} level={0} key={ent.ref} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SceneGraph;
