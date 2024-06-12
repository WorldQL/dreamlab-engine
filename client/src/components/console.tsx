import { type FC } from "react";

export const Console: FC = () => {
  return (
    <div className="bg-light-cardBackground border border-4 border-light-gray dark:border-dark-gray rounded-lg shadow-md dark:bg-dark-cardBackground w-full">
      <div className="flex items-center justify-between p-2 bg-light-gray dark:bg-dark-gray rounded-t-lg shadow-sm">
        <h2 className="text-lg font-semibold text-light-textPrimary dark:text-dark-textPrimary">
          Console
        </h2>
      </div>
      <div className="p-4">
        <p className="text-light-textSecondary dark:text-dark-textSecondary">
          Console output will appear here
        </p>
      </div>
    </div>
  );
};

export default Console;
