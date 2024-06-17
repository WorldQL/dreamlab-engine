import { FC, ChangeEvent } from "react";

interface AxisInputFieldProps {
  axis: "x" | "y";
  value: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const AxisInputField: FC<AxisInputFieldProps> = ({
  axis,
  value,
  onChange,
}: AxisInputFieldProps) => {
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      onChange({ ...e, target: { ...e.target, value: "0" } } as ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <label className="text-xs mt-2 mr-1 font-medium text-textPrimary">{axis}:</label>
      <input
        type="number"
        className="mt-1 block bg-background text-textPrimary w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
      />
    </div>
  );
};
