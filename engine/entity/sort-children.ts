import type { Entity } from "@dreamlab/engine";

const isStringParseableToInt = (s: string | undefined): s is string => {
  if (s === undefined) {
    return false;
  }

  return !Number.isNaN(Number.parseInt(s, 10));
};

export const childrenSorted = (parent: Entity): Entity[] => {
  // same as editor sorting
  const children = [...parent.children.values()].sort((a, b) => {
    const aSplit = a.name.split(".");
    const bSplit = b.name.split(".");

    if (aSplit.shift() === bSplit.shift()) {
      const ap = aSplit.pop();
      const bp = bSplit.pop();

      if (isStringParseableToInt(ap) && isStringParseableToInt(bp)) {
        // sort by trailing number after dot
        const partA = Number.parseInt(ap, 10);
        const partB = Number.parseInt(bp, 10);
        return partA - partB;
      }
    }

    return a.name.localeCompare(b.name);
  });

  return children;
};
