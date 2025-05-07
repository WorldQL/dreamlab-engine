export interface WorkerInitData {
  workerId: string;
  workerConnectUrl: string;

  worldsDirectory: string;
  worldResourcesBaseUrl: string;
  worldResourcesUseSubdirectory: boolean;
  worldDirectory: string;
  instanceId: string;
  worldId: string;
  worldSubdirectory: string;

  editMode: boolean;

  kv?: {
    url: string;
    clientUrl?: string;
    signingKey: string;
  };

  inspect?: string;
  rewriteStackTraces?: boolean;
}
