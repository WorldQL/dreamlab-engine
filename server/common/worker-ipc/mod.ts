import { HostToWorkerMessage } from "./host-to-worker.ts";
import { WorkerToHostMessage } from "./worker-to-host.ts";

export * from "./host-to-worker.ts";
export * from "./worker-to-host.ts";

export type Op<
  T extends string,
  Side extends "host" | "worker" | "both" = "both",
> =
  & (Side extends "both" ? HostToWorkerMessage | WorkerToHostMessage
    : Side extends "host" ? HostToWorkerMessage
    : WorkerToHostMessage)
  & { op: T };
