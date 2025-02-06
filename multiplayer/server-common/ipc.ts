import { ConnectionId } from "@dreamlab/engine";
import { ClientPacket, ServerPacket } from "@dreamlab/proto/play.ts";
import { Scene, SceneDescEntity } from "@dreamlab/scene";
import type { RichGameStatus } from "./rich-status.ts";
import type { WorkerMetrics } from "../server-host/metrics.ts";

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

export type HostIPCMessage =
  | ConnectionEstablishedMessage
  | ConnectionDroppedMessage
  | IncomingPacketMessage
  | SceneDefinitionRequestMessage
  | ReloadEditSceneMessage
  | PlaySessionStateMessage
  | ImportEditPrefab
  | MetricsRequestMessage;

interface WorkerUpMessage {
  op: "WorkerUp";
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
  | OutgoingPacketMessage
  | ReportRichStatusMessage
  | SceneDefinitionResponseMessage
  | PauseChangedMessage
  | GameLoadedMessage
  | MetricsResponseMessage;
