import type { SimpleIcon } from "npm:simple-icons";

export * from "npm:lucide-static";
export * from "npm:simple-icons";

const parser = new DOMParser();
export function icon(icon: SimpleIcon | string): Element {
  const svg = typeof icon === "string" ? icon : icon.svg;
  const doc = parser.parseFromString(svg, "image/svg+xml");

  return doc.firstElementChild!;
}
