import React, { FC } from "react";

export const Panel: FC<{ title: string; className?: string; children: React.ReactNode }> = ({
  title,
  className,
  children,
}) => {
  return (
    <div
      className={
        "bg-light-cardBackground border border-4 border-light-gray dark:border-dark-gray rounded-lg shadow-md dark:bg-dark-cardBackground" +
        (className ? ` ${className}` : "")
      }
    >
      <div className="flex items-center justify-between p-2 bg-light-gray dark:bg-dark-gray shadow-sm">
        <h2 className="text-lg font-semibold text-light-textPrimary dark:text-dark-textPrimary">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
};
