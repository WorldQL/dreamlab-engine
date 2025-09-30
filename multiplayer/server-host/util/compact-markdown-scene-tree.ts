import { Scene, SceneDescEntity } from "../../../scene-graph/schema.ts";

interface SimpleEntityDefinition {
  name: string;
  type: string;
  children: SimpleEntityDefinition[];
  behaviors: string[];
  position: { x: number; y: number };
  scale: { x: number; y: number };
}

/**
 * Recursively builds a simplified version of an entity (ignoring name for equality)
 * and its children.
 */
function buildSimpleDefinitionOfNodeAndChildren(
  entity: SceneDescEntity,
): SimpleEntityDefinition {
  const name = entity.name;
  // We assume the type is always like "@core/SomeType"
  const type = entity.type.split("@core/").pop()!;
  const behaviors: string[] = [];
  for (const behavior of entity.behaviors ?? []) {
    behaviors.push(behavior.script.split("res://").pop()!);
  }

  const position = entity.transform?.position ?? { x: 0, y: 0 };
  const scale = entity.transform?.scale ?? { x: 1, y: 1 };
  const children: SimpleEntityDefinition[] = [];
  for (const child of entity.children ?? []) {
    children.push(buildSimpleDefinitionOfNodeAndChildren(child));
  }

  return { name, type, children, behaviors, position, scale };
}

/**
 * Returns a string signature of an entity (ignoring its name) so that
 * two entities with the same type, behaviors, and child structure have the same signature.
 */
function getEntitySignature(entity: SimpleEntityDefinition): string {
  return JSON.stringify({
    type: entity.type,
    behaviors: entity.behaviors,
    // For children we only include their signature so that the entire structure is considered.
    children: entity.children.map(getEntitySignature),
  });
}

/**
 * Formats a number with up to 2 decimal places, dropping trailing zeros.
 */
function formatNumber(n: number): string {
  if (n === 0) return "0";
  return n.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * Converts a single entity into its markdown representation.
 * It prints the entity name and type, then any behavior scripts,
 * and then its children (using grouping).
 */
function entityToMarkdown(entity: SimpleEntityDefinition, indent: string = ""): string {
  const posAndScale = `(${formatNumber(entity.position.x)}, ${formatNumber(entity.position.y)}, ${formatNumber(entity.scale.x)}, ${formatNumber(entity.scale.y)})`;
  let md = `${indent}- ${entity.name} (${entity.type}) ${posAndScale}\n`;
  // List attached behavior scripts first.
  for (const behavior of entity.behaviors) {
    md += `${indent}  - ${behavior}\n`;
  }
  // Then list its children using grouping.
  if (entity.children.length > 0) {
    md += siblingsToMarkdown(entity.children, indent + "  ");
  }
  return md;
}

/**
 * Converts an array of sibling entities into markdown, grouping identical consecutive ones.
 *
 * If a group has more than 25 identical entries, it prints the first two then a line like:
 *   - [N more identical entities]
 */
function siblingsToMarkdown(entities: SimpleEntityDefinition[], indent: string): string {
  let md = "";
  let i = 0;
  while (i < entities.length) {
    const currentSig = getEntitySignature(entities[i]);
    let count = 1;
    // Group consecutive entities with the same signature.
    while (
      i + count < entities.length &&
      getEntitySignature(entities[i + count]) === currentSig
    ) {
      count++;
    }
    if (count > 25) {
      // Print first 25 fully...
      md += entityToMarkdown(entities[i], indent);
      md += entityToMarkdown(entities[i + 1], indent);
      // ...and then a collapsed entry.
      md += `${indent}- [${count - 2} more identical entities]\n`;
    } else {
      for (let j = 0; j < count; j++) {
        md += entityToMarkdown(entities[i + j], indent);
      }
    }
    i += count;
  }
  return md;
}

/**
 * Builds a markdown section for a set of entities in a scene (e.g., world, local).
 */
function buildSectionMarkdown(sectionName: string, entities: SceneDescEntity[]): string {
  let md = `${sectionName}:\n`;
  const simpleDefs = entities.map(buildSimpleDefinitionOfNodeAndChildren);
  md += siblingsToMarkdown(simpleDefs, "");
  return md;
}

/**
 * Converts the entire scene into a markdown string representing its tree structure.
 *
 * For example:
 *
 * world:
 * - Platform (RectCollider)
 *   - ColoredSquare (ColoredSquare)
 * - Platform.1 (RectCollider)
 *   - ColoredSquare (ColoredSquare)
 * - [2 more identical entities]
 * local:
 * - Something (Some Type)
 *
 * Entities are grouped if they have identical type, attached behavior scripts, and children.
 */
export function toMarkdownSceneTree(scene: Scene): string {
  const local = scene.local ?? [];
  const world = scene.world ?? [];
  const server = scene.server ?? [];
  const prefabs = scene.prefabs ?? [];

  const sections: string[] = [];

  if (world.length) {
    sections.push(buildSectionMarkdown("world", world));
  }
  if (local.length) {
    sections.push(buildSectionMarkdown("local", local));
  }
  if (server.length) {
    sections.push(buildSectionMarkdown("server", server));
  }
  if (prefabs.length) {
    sections.push(buildSectionMarkdown("prefabs", prefabs));
  }

  return sections.join("\n");
}
