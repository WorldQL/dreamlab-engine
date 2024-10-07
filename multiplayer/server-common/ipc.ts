import { ConnectionId } from "@dreamlab/engine";
import { ClientPacket, ServerPacket } from "@dreamlab/proto/play.ts";
import { SceneDesc } from "@dreamlab/scene";

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

export type HostIPCMessage =
  | ConnectionEstablishedMessage
  | ConnectionDroppedMessage
  | IncomingPacketMessage
  | SceneDefinitionRequestMessage
  | ReloadEditSceneMessage;

interface WorkerUpMessage {
  op: "WorkerUp";
}

interface OutgoingPacketMessage {
  op: "OutgoingPacket";
  to: string | null; // null to broadcast
  packet: ServerPacket;
}

interface SetStatusMessage {
  op: "SetStatus";
  status: object;
}

interface SceneDefinitionResponseMessage {
  op: "SceneDefinitionResponse";
  sceneJson: SceneDesc;
}

export type WorkerIPCMessage =
  | WorkerUpMessage
  | OutgoingPacketMessage
  | SetStatusMessage
  | SceneDefinitionResponseMessage;
