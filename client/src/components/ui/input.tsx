import { FC, ChangeEvent } from "react-jsx/jsx-runtime";

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
      <label className="block text-sm font-medium text-light-textPrimary dark:text-dark-textPrimary">
        {label}
      </label>
      <input
        type={type}
        className="mt-1 block bg-light-background dark:bg-dark-background dark:text-white w-full rounded-md border-gray-300 shadow-sm focus:border-accent-primary focus:ring focus:ring-accent-primary focus:ring-opacity-50"
        value={value}
        onChange={onChange}
      />
    </div>
  );
};
