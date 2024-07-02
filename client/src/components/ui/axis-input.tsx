// @deno-types="npm:@types/react@18.3.1"
import {
  ChangeEvent,
  ComponentPropsWithoutRef as ComponentProps,
  FocusEvent,
} from "react";
import { memo, useCallback } from "react";
import { cn } from "../../utils/cn.ts";

const AxisInputField = ({
  axis,
  value,
  onChange,
  className,
  ...props
}: Omit<ComponentProps<"input">, "children" | "type" | "value" | "onChange" | "onBlur"> & {
  readonly axis: "x" | "y";
  readonly value: number;
  onChange(value: number): void;
}) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.valueAsNumber),
    [onChange],
  );

  const handleBlur = useCallback(() => {
    (e: FocusEvent<HTMLInputElement>) => {
      if (e.target.value === "") onChange(0);
    };
  }, [onChange]);

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <label className="text-xs mt-2 mr-1 font-medium text-textPrimary">
        {axis.toUpperCase()}:
      </label>
      <input
        type="number"
        className="mt-1 px-2 py-1 block bg-background text-textPrimary w-full rounded-md border-greyLight shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    </div>
  );
};

const AxisInputFieldMemo = memo(AxisInputField);
export { AxisInputFieldMemo as AxisInputField };
