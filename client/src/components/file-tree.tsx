// @deno-types="npm:@types/react@18.3.1"
import { memo, useEffect, useState, useCallback } from "react";
import { Panel } from "./ui/panel.tsx";
import { game } from "../global-game.ts";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../utils/cn.ts";

type FileTree = {
  [key: string]: FileTree | null;
};

// const fakeFiles = [
//   ".gitignore",
//   ".vscode/extensions.json",
//   ".vscode/level.ts",
//   "assets/bishop_black.png",
//   "assets/bishop_white.png",
//   "assets/king_black.png",
//   "assets/king_white.png",
//   "assets/knight_black.png",
//   "assets/knight_white.png",
//   "assets/pawn_black.png",
//   "assets/pawn_white.png",
//   "assets/queen_black.png",
//   "assets/queen_white.png",
//   "assets/rook_black.png",
//   "assets/rook_white.png",
//   "chess-piece.ts",
//   "client.bundled.js",
//   "client.bundled.js.map",
//   "client.ts",
//   "drag-box.ts",
//   "drop-zone.ts",
//   "level.ts",
//   "level/list.ts",
//   "level/load.ts",
//   "server.ts",
//   "shared.ts",
// ];

const buildFileTree = (files: string[]): FileTree => {
  const tree: FileTree = {};

  files.forEach(file => {
    const parts = file.split("/");
    let current = tree;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? null : {};
      }
      current = current[part] as FileTree;
    });
  });

  return tree;
};

interface FileEntryProps {
  file: FileTree | null;
  name: string;
  level: number;
}

const FileEntry = ({ file, name, level }: FileEntryProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleCollapse = useCallback(() => setIsCollapsed((prev: boolean) => !prev), []);

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.dataTransfer.setData("text/plain", name);
      event.dataTransfer.setDragImage(new Image(), 0, 0);
    },
    [name],
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHovered(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHovered(false);
  }, []);

  // TODO: finish drag/drop logic
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHovered(false);
  }, []);

  return (
    <li>
      <div
        className={cn(
          "file-entry flex items-center cursor-pointer w-full relative text-sm text-textPrimary hover:text-white",
          isHovered ? "bg-primary hover:shadow-md text-white" : "hover:bg-secondary",
        )}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={toggleCollapse}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        {file && (
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
          />
        )}
        <span className="ml-2">{name}</span>
      </div>
      {file && !isCollapsed && (
        <ul>
          {Object.entries(file).map(([childName, childFile], index) => (
            <FileEntry key={index} name={childName} file={childFile} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

const FileTreeComponent = () => {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/edit/${game.instanceId}/files`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setFiles(data.files ?? []);
      } catch (error) {
        console.error("Error fetching files:", error);
        setFiles([]);
      }
    };
    fetchFiles();

    // For testing purposes
    // setFiles(fakeFiles);
  }, []);

  const fileTree = buildFileTree(files);

  return (
    <Panel title="Files" className="h-full">
      <div className="p-2 h-full">
        <ul className="file-tree space-y-1">
          {Object.entries(fileTree).map(([name, file], index) => (
            <FileEntry key={index} name={name} file={file} level={0} />
          ))}
        </ul>
      </div>
    </Panel>
  );
};

const PrefabsMemo = memo(FileTreeComponent);
export { PrefabsMemo as Prefabs };
