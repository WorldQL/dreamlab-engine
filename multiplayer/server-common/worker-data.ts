export interface WorkerInitData {
  workerId: string;
  workerConnectUrl: string;

  worldResourcesBaseUrl: string;
  worldDirectory: string;
  instanceId: string;
  worldId: string;
  worldSubdirectory: string;

  editMode: boolean;

  kvUrl: string;
  kvClientUrl?: string;
  kvSigningKey: string;

  inspect?: string;
}
