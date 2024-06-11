import { FC, useContext, useState } from "react-jsx/jsx-runtime";
import { Entity } from "@dreamlab/engine";
import { SelectedEntityContext } from "../context/selected-entity-context.tsx";
import { game } from "../global-game.ts";

const EntityEntry: FC<{ entity: Entity; level: number }> = ({ entity, level }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { selectedEntity, setSelectedEntity } = useContext(SelectedEntityContext);

  // TODO: Accept a URL in addition to an emoji for icons.
  const iconVal = (entity.constructor as typeof Entity).icon
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
          selectedEntity === entity ? "bg-blue-100" : "hover:bg-gray-100"
        }`}
        onClick={handleEntityClick}
      >
        {/* TODO: replace with entity icon */}
        <span className="mr-1 text-gray-500" onClick={toggleCollapse}>
          {entity.children.size > 0 ? (isCollapsed ? `+ ${icon}` : `- ${icon}`) : `${icon}`}
        </span>
        <span className="text-sm">{entity.name}</span>
      </div>
      {entity.children.size > 0 && !isCollapsed && (
        <ul className="mt-1">
          {[...entity.children.values()].map((e) => <EntityEntry entity={e} level={level + 1} />)}
        </ul>
      )}
    </li>
  );
};

export const SceneGraph: FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Scene Graph</h2>
      <div className="border border-gray-200 rounded-md">
        <ul>
          {[...game.world.children.values()].map((ent) => <EntityEntry entity={ent} level={0} />)}
        </ul>
      </div>
    </div>
  );
};
