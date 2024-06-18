import { Entity } from "@dreamlab/engine";
import { atom } from "jotai";

export const selectedEntityAtom = atom<Entity | null>(null);
export const isRunningAtom = atom<boolean>(false);
export const isPausedAtom = atom<boolean>(false);
