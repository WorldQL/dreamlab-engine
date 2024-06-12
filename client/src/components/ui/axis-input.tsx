import { FC, ChangeEvent } from "react";

interface AxisInputFieldProps {
  axis: "x" | "y";
  value: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const AxisInputField: FC<AxisInputFieldProps> = ({ axis, value, onChange }) => {
  return (
    <div className="flex items-center space-x-1">
      <label className="text-xs mt-2 mr-1 font-medium text-light-textPrimary dark:text-dark-textPrimary">
        {axis}:
      </label>
      <input
        type="number"
        className="mt-1 block bg-light-background dark:bg-dark-background dark:text-white w-full rounded-md border-gray-300 shadow-sm focus:border-accent-primary focus:ring focus:ring-accent-primary focus:ring-opacity-50"
        value={value}
        onChange={onChange}
      />
    </div>
  );
};
