// @deno-types="npm:@types/react@18.3.1"
import { ChangeEvent, ComponentPropsWithoutRef as ComponentProps, FocusEvent } from "react";
import { memo, useCallback } from "react";
import { cn } from "../../utils/cn.ts";

type TextInputProps = { type: "text"; value: string; onChange(value: string): void };
type NumberInputProps = { type: "number"; value: number; onChange(value: number): void };

const InputField = ({
  label,
  value,
  onChange,
  type,
  className,
  ...props
}: Omit<ComponentProps<"input">, "children" | "type" | "value" | "onChange" | "onBlur"> & {
  readonly label: string;
} & (TextInputProps | NumberInputProps)) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (type === "text") onChange(e.target.value);
      else if (type === "number") onChange(e.target.valueAsNumber);
      else throw new TypeError("invalid prop: type");
    },
    [type, onChange],
  );

  const handleBlur = useCallback(() => {
    (e: FocusEvent<HTMLInputElement>) => {
      if (e.target.value !== "") return;

      if (type === "text") onChange("");
      else if (type === "number") onChange(0);
      else throw new TypeError("invalid prop: type");
    };
  }, [onChange]);

  return (
    <div className={cn("mb-2", className)}>
      <label className="block text-sm font-medium text-textPrimary">{label}</label>
      <input
        type={type}
        className="mt-1 px-2 py-1 block bg-background text-textPrimary w-full rounded-md border-greyLight shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    </div>
  );
};

const InputFieldMemo = memo(InputField);
export { InputFieldMemo as InputField };
