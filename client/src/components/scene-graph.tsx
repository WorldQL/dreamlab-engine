import { FC, useContext, useState } from "react-jsx/jsx-runtime";
import { Entity } from "@dreamlab/engine";
import { SelectedEntityContext } from "../context/selected-entity-context.tsx";
import { game } from "../global-game.ts";
import { useForceUpdateOnEntityChange } from "../hooks/force-update-on-change.ts";

const EntityEntry: FC<{ entity: Entity; level: number }> = ({ entity, level }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { selectedEntity, setSelectedEntity } = useContext(SelectedEntityContext);

  // TODO: Accept a URL in addition to an emoji for icons.
  const iconVal = (entity.constructor as typeof Entity).icon;
  const icon = iconVal ? iconVal : "{icon}";

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleEntityClick = () => {
    setSelectedEntity(entity);
  };

  return (
    <li key={entity.ref} className={`ml-${level * 4}`}>
      <div
        className={`flex cursor-pointer items-center rounded-md ${
          selectedEntity === entity
            ? "bg-accent-primaryLight dark:bg-accent-primaryDark"
            : "hover:bg-light-cardBackground dark:hover:bg-dark-cardBackground"
        }`}
        onClick={handleEntityClick}
      >
        {/* TODO: replace with entity icon */}
        <span
          className="mr-1 text-light-textSecondary dark:text-dark-textSecondary"
          onClick={toggleCollapse}
        >
          {entity.children.size > 0 ? (isCollapsed ? "+ " : "- ") : ""} {icon}
        </span>
        <span className="text-sm text-light-textPrimary dark:text-dark-textPrimary">
          {entity.name}
        </span>
      </div>
      {entity.children.size > 0 && !isCollapsed && (
        <ul className="mt-1">
          {[...entity.children.values()].map(e => (
            <EntityEntry entity={e} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

export const SceneGraph: FC = () => {
  useForceUpdateOnEntityChange(game.world);

  return (
    <div className="bg-light-cardBackground rounded-lg shadow-md dark:bg-dark-cardBackground">
      <h2 className="text-lg font-semibold mb-4 text-light-textPrimary dark:text-dark-textPrimary">
        Scene Graph
      </h2>
      <div className="border border-light-textSecondary rounded-md dark:border-dark-textSecondary">
        <ul>
          {[...game.world.children.values()].map(ent => (
            <EntityEntry entity={ent} level={0} />
          ))}
        </ul>
      </div>
    </div>
  );
};
