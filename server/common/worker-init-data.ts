export interface WorkerInitData {
  workerId: string;
  workerConnectUrl: string;

  instanceId: string;
  worldId: string;
  worldVariant: string;
  worldScriptURLBase: string;

  editMode: boolean;

  tempDir: string;

  debugMode: boolean;
}
