import type { LucideIcon } from "lucide-react";
import { Move3D, Rotate3D, Scale3D, Scaling, Pointer } from "lucide-react";
// @deno-types="npm:@types/react@18.3.1"
import { useCallback, useMemo } from "react";
import { Tool, TransformMode, useTool } from "../../hooks/useTool.ts";
import { IconButton } from "./icon-button.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.tsx";
import { cn } from "../../utils/cn.ts";

export const ToolSelector = () => {
  return (
    <div className="absolute top-4 left-4">
      <ToolButton
        tool="transform"
        transformMode="combined"
        tooltip="Combined"
        icon={Pointer} // TODO: Better icon?
        top
      />
      <ToolButton
        tool="transform"
        transformMode="translate"
        tooltip="Translate"
        icon={Move3D}
      />
      <ToolButton tool="transform" transformMode="rotate" tooltip="Rotate" icon={Rotate3D} />
      <ToolButton tool="transform" transformMode="scale" tooltip="Scale" icon={Scale3D} />

      <ToolButton
        tool="box-resize"
        transformMode={undefined}
        tooltip="Box Resize"
        icon={Scaling}
        bottom
      />
    </div>
  );
};

const ToolButton = ({
  tool,
  transformMode,
  icon,
  tooltip,
  top,
  bottom,
}: {
  tool: Tool;
  transformMode: TransformMode | undefined;
  icon: LucideIcon;
  tooltip: string;
  top?: boolean;
  bottom?: boolean;
}) => {
  const { tool: activeTool, setTool, transformMode: activeMode, setTransformMode } = useTool();

  const active = useMemo<boolean>(() => {
    if (tool === "box-resize" && activeTool === "box-resize") return true;
    if (tool === "transform" && activeTool === "transform" && transformMode === activeMode) {
      return true;
    }

    return false;
  }, [tool, activeTool, transformMode, activeMode]);

  const handleClick = useCallback(() => {
    if (transformMode) {
      setTransformMode(transformMode);
      setTool(tool, transformMode);
    } else {
      setTool(tool);
    }
  }, [tool, setTool, transformMode, setTransformMode]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton
          icon={icon}
          onClick={handleClick}
          className={cn(
            "rounded-none",
            top && "rounded-t",
            bottom && "rounded-b",
            active && "bg-primary hover:bg-primaryDark",
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};
