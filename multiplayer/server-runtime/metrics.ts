import type { WorkerMetrics } from "../server-host/metrics.ts";

export const gatherMetrics = async (): Promise<WorkerMetrics> => {
  const pid = Deno.pid;
  const mem = Deno.memoryUsage();

  // TODO: real metrics
  return { cpu: 0, memory: mem.rss };
};
