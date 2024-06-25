import type { ComponentPropsWithoutRef as ComponentProps } from "react";
import { forwardRef, memo } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn.ts";

type Props = Omit<ComponentProps<"button">, "children"> & {
  readonly icon: LucideIcon;
  disabled?: boolean;
};

const IconButton = forwardRef<HTMLButtonElement, Props>(
  ({ icon: Icon, className, disabled = false, ...props }, ref) => (
    <button
      className={cn(
        "rounded text-white bg-secondary hover:bg-secondaryDark p-1 flex items-center justify-center w-8 h-8",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      ref={ref}
      disabled={disabled}
      {...props}
    >
      <Icon className="aspect-square" />
    </button>
  ),
);

const IconButtonMemo = memo(IconButton);
export { IconButtonMemo as IconButton };
