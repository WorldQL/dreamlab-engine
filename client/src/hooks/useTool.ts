import { BoxResizeGizmo, Gizmo } from "@dreamlab/engine";
import { atom, useAtom } from "jotai";
// @deno-types="npm:@types/react@18.3.1"
import { useCallback, useMemo } from "react";
import { currentGame } from "../global-game.ts";

const tool = ["transform", "box-resize"] as const;
const transformMode = ["translate", "rotate", "scale", "combined"] as const;

export type Tool = (typeof tool)[number];
export type TransformMode = (typeof transformMode)[number];

export const toolAtom = atom<Tool>("transform");
export const transformModeAtom = atom<TransformMode>("combined");

export const useTool = () => {
  const [tool, setTool] = useAtom(toolAtom);
  const [transformMode, setTransformMode] = useAtom(transformModeAtom);

  // TODO: Ignore on running game

  const setToolFn = useCallback(
    (tool: Tool, mode?: TransformMode) => {
      setTool(prevTool => {
        if (prevTool === tool) return prevTool;

        const gizmo = currentGame.local.children.get("Gizmo")?.cast(Gizmo);
        const boxresize = currentGame.local.children
          .get("BoxResizeGizmo")
          ?.cast(BoxResizeGizmo);

        const target = gizmo?.target ?? boxresize?.target;

        gizmo?.destroy();
        boxresize?.destroy();

        if (tool === "transform") {
          const gizmo = currentGame.local.spawn({
            type: Gizmo,
            name: Gizmo.name,
          });

          gizmo.mode = mode ?? "combined";
          gizmo.target = target;
        } else if (tool === "box-resize") {
          const boxresize = currentGame.local.spawn({
            type: BoxResizeGizmo,
            name: BoxResizeGizmo.name,
          });

          boxresize.target = target;
        }

        // TODO
        return tool;
      });
    },
    [setTool, transformMode],
  );

  const setTransformModeFn = useCallback(
    (mode: TransformMode) => {
      setTransformMode(prevMode => {
        if (prevMode === mode) return prevMode;

        const gizmo = currentGame.local.children.get("Gizmo")?.cast(Gizmo);
        if (gizmo) gizmo.mode = mode;

        return mode;
      });
    },
    [setTransformMode],
  );

  const mem = useMemo(
    () => ({
      tool,
      setTool: setToolFn,

      transformMode,
      setTransformMode: setTransformModeFn,
    }),
    [tool, setToolFn, transformMode, setTransformModeFn],
  );

  return mem;
};
