import { InfluxDB, WriteApi as $WriteApi, Point } from "npm:@influxdata/influxdb-client";
import { IPCWorker } from "./worker.ts";
import { CONFIG } from "./config.ts";

const details = CONFIG.influxdb;
const client = details ? new InfluxDB({ url: details.url, token: details.token }) : undefined;

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
  readonly cpu: number;
  readonly memory: number;
  // TODO: real metrics
};

const internalReport = async (
  write: $WriteApi,
  worker: IPCWorker,
  ts = new Date(),
): Promise<void> => {
  const metrics = await worker.metrics();
  console.log(metrics);

  const { workerData } = worker;
  const point = new Point("metrics")
    .timestamp(ts)
    .tag("workerId", worker.workerId)
    .tag("instanceId", workerData.instanceId)
    .tag("worldId", workerData.worldId)
    .tag("editMode", workerData.editMode ? "true" : "false");
  // TODO: add real metrics

  write.writePoint(point);
};

export const report = async (...workers: IPCWorker[]): Promise<void> => {
  // do nothing if metrics reporting is disabled
  if (!client) return;

  const now = new Date();
  await using write = writeApi();

  await Promise.allSettled(
    workers.map(async worker => {
      await internalReport(write, worker, now);
    }),
  );

  await write.flush();
};
