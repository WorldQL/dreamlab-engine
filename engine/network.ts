import { JsonValue } from "./value/mod.ts";

export type ConnectionId = string | undefined;
export type CustomMessageData = object & JsonValue;

export type CustomMessageListener = (
  from: ConnectionId,
  channel: string,
  data: CustomMessageData,
) => void | Promise<void>;

export interface PeerInfo {
  connectionId: ConnectionId;
  playerId: string;
  nickname: string;
}

export interface BaseNetworking {
  get connectionId(): ConnectionId;
  get peers(): PeerInfo[];
  sendCustomMessage(to: ConnectionId, channel: string, data: CustomMessageData): void;
  broadcastCustomMessage(channel: string, data: CustomMessageData): void;
  onReceiveCustomMessage(listener: CustomMessageListener): void;
}

export interface ClientNetworking extends BaseNetworking {}
export interface ServerNetworking extends BaseNetworking {}
