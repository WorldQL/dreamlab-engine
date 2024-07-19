// context/editor-context.tsx
import { Entity } from "@dreamlab/engine";
import { atom } from "jotai";

interface HistoryEntry {
  type: "add" | "remove";
  entity: Entity;
}

export const selectedEntityAtom = atom<Entity | null>(null);
export const copiedEntityAtom = atom<Entity | null>(null);
export const isRunningAtom = atom<boolean>(false);
export const isPausedAtom = atom<boolean>(false);
export const historyAtom = atom<HistoryEntry[]>([]);
