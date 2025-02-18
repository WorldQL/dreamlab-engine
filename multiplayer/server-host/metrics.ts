import { WriteApi as $WriteApi, InfluxDB, Point } from "npm:@influxdata/influxdb-client";
import { CONFIG } from "./config.ts";
import { IPCWorker } from "./worker.ts";

const details = {
  url: CONFIG.MULTIPLAYER_INFLUXDB_URL,
  token: CONFIG.MULTIPLAYER_INFLUXDB_TOKEN,
  bucket: CONFIG.MULTIPLAYER_INFLUXDB_BUCKET,
  org: CONFIG.MULTIPLAYER_INFLUXDB_ORG,
};

// rare intentional ==, want the type coersion to make sure details.url is defined and not empty.
console.log(details)
const client = details && !(details.url == false) ? new InfluxDB({ url: details.url, token: details.token }) : undefined;

type WriteApi = $WriteApi & { [Symbol.asyncDispose]: () => Promise<void> };
const writeApi = (): WriteApi => {
  if (!client || !details) throw new Error("cannot create write api when metrics are disabled");

  const { org, bucket } = details;
  const write = client.getWriteApi(org, bucket, "ns");

  return Object.assign(write, {
    [Symbol.asyncDispose]: async () => {
      await write.close();
    },
  });
};

export type WorkerMetrics = {
  readonly ts?: Date;
  readonly cpu: number;
  readonly memory: number;
  readonly connections: number;
};

const internalReport = (
  write: $WriteApi,
  worker: IPCWorker,
  metrics: WorkerMetrics,
  { ts = new Date() }: { ts?: Date } = {},
): void => {
  const { workerData } = worker;
  const point = new Point("metrics")
    .timestamp(metrics.ts ?? ts)
    .tag("workerId", worker.workerId)
    .tag("instanceId", workerData.instanceId)
    .tag("worldId", workerData.worldId)
    .tag("editMode", workerData.editMode ? "true" : "false")
    .floatField("cpu", metrics.cpu)
    .uintField("memory", metrics.memory)
    .uintField("connections", metrics.connections);

  write.writePoint(point);
};

export const report = async (
  ...workers: IPCWorker[] | { worker: IPCWorker; metrics: WorkerMetrics }[]
): Promise<void> => {
  // do nothing if metrics reporting is disabled
  if (!client) return;

  const now = new Date();
  await using write = writeApi();

  await Promise.allSettled(
    workers.map(async input => {
      const isObject = "worker" in input && "metrics" in input;
      const worker = isObject ? input.worker : input;
      const metrics = isObject ? input.metrics : await worker.metrics();

      internalReport(write, worker, metrics, { ts: now });
    }),
  );

  try {
    await write.flush();
  } catch {
    // ignore
  }
};
