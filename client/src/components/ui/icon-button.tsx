import type { ComponentPropsWithoutRef as ComponentProps } from "react";
import { forwardRef, memo } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn.ts";

type Props = Omit<ComponentProps<"button">, "children"> & { readonly icon: LucideIcon };

const IconButton = forwardRef<HTMLButtonElement, Props>(
  ({ icon: Icon, className, ...props }, ref) => (
    <button
      className={cn("rounded text-white bg-secondary hover:bg-secondaryDark p-1", className)}
      ref={ref}
      {...props}
    >
      <Icon className="h-full w-auto aspect-square" />
    </button>
  ),
);

const IconButtonMemo = memo(IconButton);
export { IconButtonMemo as IconButton };
