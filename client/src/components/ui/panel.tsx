import React, { FC } from "react";

interface PanelProps {
  title: string;
  className?: string;
  children: React.ReactNode;
}

export const Panel: FC<PanelProps> = ({ title, className, children }: PanelProps) => {
  return (
    <div
      className={
        "bg-card border-4 border-grey rounded-lg shadow-md overflow-y-auto" +
        (className ? ` ${className}` : "")
      }
    >
      <div className="flex items-center justify-between p-2 bg-grey shadow-sm">
        <h2 className="text-lg font-semibold text-textPrimary">{title}</h2>
      </div>
      {children}
    </div>
  );
};
