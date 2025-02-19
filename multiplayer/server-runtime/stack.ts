import type { WorkerInitData } from "../server-common/worker-data.ts";

declare global {
  interface ErrorConstructor {
    prepareStackTrace?: (error: Error, callsites: unknown[]) => string;
  }
}

export const rewriteStackTraces = (workerData: WorkerInitData) => {
  if (!workerData.rewriteStackTraces) return;

  const original = Error.prepareStackTrace;
  if (typeof original !== "function") return;

  const { worldsDirectory, worldId } = workerData;
  const worldDirectory = `${worldsDirectory}/${worldId}`;

  const mapLine = (line: string): string => line.replace(`(${worldDirectory}`, "(res:/");

  Error.prepareStackTrace = (error, stack) => {
    const result = original(error, stack);
    return result.split("\n").map(mapLine).join("\n");
  };
};
