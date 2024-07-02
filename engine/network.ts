import { JsonValue } from "./value/mod.ts";

export type ConnectionId = string | undefined;
export type CustomMessageData = object & JsonValue;

export type CustomMessageListener = (
  from: ConnectionId,
  channel: string,
  data: CustomMessageData,
) => void | Promise<void>;

export interface BaseNetworking {
  get peers(): ConnectionId[];
  sendCustomMessage(to: ConnectionId, channel: string, data: CustomMessageData): void;
  broadcastCustomMessage(channel: string, data: CustomMessageData): void;
  onReceiveCustomMessage(listener: CustomMessageListener): void;
}

export interface ClientNetworking extends BaseNetworking {
  get connectionId(): ConnectionId;
}
export interface ServerNetworking extends BaseNetworking {}