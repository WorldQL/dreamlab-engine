import { FC, ChangeEvent } from "react";

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
}

export const InputField: FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}) => {
  return (
    <div className={`mb-2 ${className}`}>
      <label className="block text-sm font-medium text-textPrimary">{label}</label>
      <input
        type={type}
        className="mt-1 block bg-background text-textPrimary w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        value={value}
        onChange={onChange}
      />
    </div>
  );
};