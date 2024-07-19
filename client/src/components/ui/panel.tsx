// @deno-types="npm:@types/react@18.3.1"
import React, { FC } from "react";

interface PanelProps {
  title: string;
  className?: string;
  children: React.ReactNode;
  onDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
}

export const Panel: FC<PanelProps> = ({
  title,
  className,
  children,
  onDrop,
  onDragOver,
}: PanelProps) => {
  return (
    <div
      className={
        "bg-card border-4 border-grey rounded-lg shadow-md flex flex-col" +
        (className ? ` ${className}` : "")
      }
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div className="flex-none flex items-center justify-between p-2 bg-grey shadow-sm">
        <h2 className="text-lg font-semibold text-textPrimary">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};
