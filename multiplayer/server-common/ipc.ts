import { ConnectionId } from "@dreamlab/engine";
import { ClientPacket, ServerPacket } from "@dreamlab/proto/play.ts";

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

export type HostIPCMessage =
  | ConnectionEstablishedMessage
  | ConnectionDroppedMessage
  | IncomingPacketMessage;

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

export type WorkerIPCMessage = WorkerUpMessage | OutgoingPacketMessage | SetStatusMessage;
