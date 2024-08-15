export * from "npm:lucide-static";

const parser = new DOMParser();
export function icon(icon: string): Element {
  const doc = parser.parseFromString(icon, "image/svg+xml");
  return doc.firstElementChild!;
}
