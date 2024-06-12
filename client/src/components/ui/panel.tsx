import React, { FC } from "react";

export const Panel: FC<{ title: string; className?: string; children: React.ReactNode }> = ({
  title,
  className,
  children,
}) => {
  return (
    <div
      className={
        "bg-cardBackground border border-4 border-gray rounded-lg shadow-md" +
        (className ? ` ${className}` : "")
      }
    >
      <div className="flex items-center justify-between p-2 bg-gray shadow-sm">
        <h2 className="text-lg font-semibold text-textPrimary">{title}</h2>
      </div>
      {children}
    </div>
  );
};
