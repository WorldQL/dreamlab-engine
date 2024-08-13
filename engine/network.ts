import { JsonValue } from "./value/mod.ts";

export type ConnectionId = "server" | (string & Record<never, never>); // LiteralUnion<'server', string>
export type CustomMessageData = object & JsonValue;

export type CustomMessageListener = (
  from: ConnectionId,
  channel: string,
  data: CustomMessageData,
) => void | Promise<void>;

export interface ConnectionInfo {
  id: ConnectionId;
  playerId: string;
  nickname: string;
}

export interface BaseNetworking {
  get self(): ConnectionId;
  get connections(): ConnectionInfo[];
  sendCustomMessage(to: ConnectionId, channel: string, data: CustomMessageData): void;
  broadcastCustomMessage(channel: string, data: CustomMessageData): void;
  onReceiveCustomMessage(listener: CustomMessageListener): void;
  disconnect(): void;
}

export interface ClientNetworking extends BaseNetworking {}
export interface ServerNetworking extends BaseNetworking {}
