import { Entity } from "@dreamlab/engine";

/**
 * Determines the enabled state of a list of entities.
 *  - "allEnabled" if all entities are enabled.
 *  - "allDisabled" if all entities are disabled.
 *  - "mixed" if there's a mix of enabled and disabled entities.
 */
export function getEntitiesEnabledState(
  entities: readonly Entity[],
): "allEnabled" | "allDisabled" | "mixed" {
  if (entities.length === 0) return "mixed";

  let allEnabled = true;
  let allDisabled = true;

  for (const entity of entities) {
    if (entity.enabled) {
      allDisabled = false;
    } else {
      allEnabled = false;
    }

    if (!allEnabled && !allDisabled) {
      return "mixed";
    }
  }

  if (allEnabled) return "allEnabled";
  if (allDisabled) return "allDisabled";
  return "mixed";
}
