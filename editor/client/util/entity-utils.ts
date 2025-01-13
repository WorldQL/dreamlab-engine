import { Entity } from "@dreamlab/engine";
import { isRoot } from "../ui/keyboard-shortcuts.ts";

/**
 * Determines the enabled state of a list of entities.
 *  - "allEnabled" if all entities and root children are enabled.
 *  - "allDisabled" if all entities and root children are disabled.
 *  - "mixed" if there's a mix of enabled and disabled entities or children.
 */
export function getEntitiesEnabledState(
  entities: readonly Entity[],
): "allEnabled" | "allDisabled" | "mixed" {
  if (entities.length === 0) return "mixed";

  let allEnabled = true;
  let allDisabled = true;

  for (const entity of entities) {
    const entitiesToCheck = isRoot(entity) ? Array.from(entity.children.values()) : [entity];

    for (const e of entitiesToCheck) {
      if (e.enabled) {
        allDisabled = false;
      } else {
        allEnabled = false;
      }

      if (!allEnabled && !allDisabled) {
        return "mixed";
      }
    }
  }

  if (allEnabled) return "allEnabled";
  if (allDisabled) return "allDisabled";
  return "mixed";
}
