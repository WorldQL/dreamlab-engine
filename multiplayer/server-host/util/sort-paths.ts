type TreeFile = { type: "file"; name: string; path: string };
type TreeDir = { type: "dir"; name: string; files: Tree };
type Tree = (TreeFile | TreeDir)[];

const sortTree = (root: Tree) => {
  for (const entry of root) {
    if (entry.type === "dir") sortTree(entry.files);
  }

  root.sort((a, b) => {
    if (a.type === "file" && b.type === "dir") return 1;
    if (a.type === "dir" && b.type === "file") return -1;

    return a.name.localeCompare(b.name);
  });
};

const flattenTree = (root: Tree) => {
  const files: string[] = [];
  for (const entry of root) {
    if (entry.type === "dir") files.push(...flattenTree(entry.files));
    else files.push(entry.path);
  }

  return files;
};

export const sortPaths = (paths: string[]): string[] => {
  const tree: Tree = [];
  paths.forEach(path => {
    const [filename, ...dirs] = path.split("/").reverse();
    dirs.reverse();

    let root = tree;
    for (const segment of dirs) {
      let dir: TreeDir | undefined = root.find(
        (x): x is TreeDir => x.type === "dir" && x.name === segment,
      );

      if (!dir) {
        dir = { type: "dir", name: segment, files: [] };
        root.push(dir);
      }

      root = dir.files;
    }

    root.push({ type: "file", name: filename, path });
  });

  sortTree(tree);
  return flattenTree(tree);
};
