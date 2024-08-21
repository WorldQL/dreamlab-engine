import type { SimpleIcon } from "npm:simple-icons";

export * from "npm:lucide-static@0.429.0";
export * from "npm:simple-icons@13.6.0";

const parser = new DOMParser();
export function icon(icon: SimpleIcon | string): Element {
  const svg = typeof icon === "string" ? icon : icon.svg;
  const doc = parser.parseFromString(svg, "image/svg+xml");

  return doc.firstElementChild!;
}
