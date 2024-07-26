import { ChevronDownIcon } from "lucide-react";
// @deno-types="npm:@types/react@18.3.1"
import { memo, useCallback, useState } from "react";
import { currentGame } from "../global-game.ts";
import { useFiles } from "../hooks/useFiles.ts";
import { cn } from "../utils/cn.ts";

type FileTree = {
  [key: string]: FileTree | null;
};

const buildFileTree = (files: string[]): FileTree => {
  const tree: FileTree = {};

  if (!Array.isArray(files)) {
    console.error("Expected files to be an array, but got:", files);
    return tree;
  }

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
  path: string;
  level: number;
}

const FileEntry = ({ file, name, path, level }: FileEntryProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleCollapse = useCallback(() => setIsCollapsed((prev: boolean) => !prev), []);

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.dataTransfer.setData("text/plain", path);
      event.dataTransfer.setDragImage(new Image(), 0, 0);
    },
    [path],
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHovered(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHovered(false);
  }, []);

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
            <FileEntry
              key={index}
              name={childName}
              file={childFile}
              path={`${path}/${childName}`}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const FileTreeComponent = () => {
  const { data, isLoading, isError } = useFiles(currentGame.instanceId);

  if (isLoading) {
    return (
      <div title="Files" className="h-full text-textPrimary p-4">
        Loading files...
      </div>
    );
  }

  if (isError) {
    return (
      <div title="Files" className="h-full text-textPrimary p-4">
        Error loading files. Please try again later.
      </div>
    );
  }

  if (!data || !data.files || data.files.length === 0) {
    return (
      <div title="Files" className="h-full text-textPrimary p-4">
        No files found.
      </div>
    );
  }

  const fileTree = buildFileTree(data.files);

  return (
    <div title="Files" className="h-full">
      <div className="p-2 h-full">
        <ul className="file-tree space-y-1">
          {Object.entries(fileTree).map(([name, file], index) => (
            <FileEntry key={index} name={name} file={file} path={name} level={0} />
          ))}
        </ul>
      </div>
    </div>
  );
};

const FileTreeMemo = memo(FileTreeComponent);
export { FileTreeMemo as FileTree };
