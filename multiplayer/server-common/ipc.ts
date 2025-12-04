import { ConnectionId } from "@dreamlab/engine";
import { ClientPacket, ServerPacket } from "@dreamlab/proto/play.ts";
import { Scene, SceneDescEntity } from "@dreamlab/scene";
import type { WorkerMetrics } from "../server-host/metrics.ts";
import type { RichGameStatus } from "./rich-status.ts";

interface ConnectionEstablishedMessage {
  op: "ConnectionEstablished";
  connectionId: ConnectionId;
  playerId: string;
  nickname: string;
}

interface ConnectionDroppedMessage {
  op: "ConnectionDropped";
  connectionId: ConnectionId;
}

interface IncomingPacketMessage {
  op: "IncomingPacket";
  from: ConnectionId;
  packet: ClientPacket;
}

interface SceneDefinitionRequestMessage {
  op: "SceneDefinitionRequest";
}

interface ReloadEditSceneMessage {
  op: "ReloadEditScene";
}

interface PlaySessionStateMessage {
  op: "PlaySessionState";
  running: boolean;
  paused: boolean;
}

interface ImportEditPrefab {
  op: "ImportEditPrefab";
  entity: SceneDescEntity;
}

interface MetricsRequestMessage {
  op: "MetricsRequest";
  id: string;
}

interface HttpAPICallMessage {
  op: "HttpAPICall";
  callId: string;
  route: string;
  params: unknown[];
}

interface HttpAPIResponseMessage {
  op: "HttpAPIResponse";
  callId: string;
  result: unknown;
}

interface HttpAPIErrorMessage {
  op: "HttpAPIError";
  callId: string;
  error: unknown; // TODO: invalid params / route not found / exception in user code
}

interface ReloadBehaviorsMessage {
  op: "ReloadBehaviors";
  scripts: string[];
}

export type HostIPCMessage =
  | ConnectionEstablishedMessage
  | ConnectionDroppedMessage
  | IncomingPacketMessage
  | SceneDefinitionRequestMessage
  | ReloadEditSceneMessage
  | PlaySessionStateMessage
  | ImportEditPrefab
  | MetricsRequestMessage
  | HttpAPICallMessage
  | ReloadBehaviorsMessage;

interface WorkerUpMessage {
  op: "WorkerUp";
}

interface WorkerHeartbeatMessage {
  op: "WorkerHeartbeat";
}

interface OutgoingPacketMessage {
  op: "OutgoingPacket";
  to: string | null; // null to broadcast
  packet: ServerPacket;
}

interface ReportRichStatusMessage {
  op: "ReportRichStatus";
  status: RichGameStatus;
}

interface SceneDefinitionResponseMessage {
  op: "SceneDefinitionResponse";
  sceneJson: Scene;
}

interface PauseChangedMessage {
  op: "PauseChanged";
  paused: boolean;
}

interface GameLoadedMessage {
  op: "GameLoaded";
}

interface MetricsResponseMessage {
  op: "MetricsResponse";
  id: string;
  metrics: WorkerMetrics;
}

export type WorkerIPCMessage =
  | WorkerUpMessage
  | WorkerHeartbeatMessage
  | OutgoingPacketMessage
  | ReportRichStatusMessage
  | SceneDefinitionResponseMessage
  | PauseChangedMessage
  | GameLoadedMessage
  | MetricsResponseMessage
  | HttpAPIResponseMessage
  | HttpAPIErrorMessage;
