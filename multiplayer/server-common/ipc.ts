import { ConnectionId } from "@dreamlab/engine";
import { ClientPacket, ServerPacket } from "@dreamlab/proto/play.ts";
import { Scene } from "@dreamlab/scene";
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

export type HostIPCMessage =
  | ConnectionEstablishedMessage
  | ConnectionDroppedMessage
  | IncomingPacketMessage
  | SceneDefinitionRequestMessage
  | ReloadEditSceneMessage
  | PlaySessionStateMessage;

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

export type WorkerIPCMessage =
  | WorkerUpMessage
  | OutgoingPacketMessage
  | ReportRichStatusMessage
  | SceneDefinitionResponseMessage
  | PauseChangedMessage;
