import type { Jsonifiable } from "@dreamlab/vendor/type-fest.ts";

export type ConnectionId = string | undefined;
export type CustomMessageData = object & Jsonifiable;

export interface BaseNetworking {
  get peers(): ConnectionId[];
  sendCustomMessage(to: ConnectionId, channel: string, data: CustomMessageData): void;
  broadcastCustomMessage(channel: string, data: CustomMessageData): void;
  onReceiveCustomMessage(
    listener: (
      from: ConnectionId,
      channel: string,
      data: CustomMessageData,
    ) => void | Promise<void>,
  ): void;
}

export interface ClientNetworking extends BaseNetworking {
  get connectionId(): ConnectionId;
}
export interface ServerNetworking extends BaseNetworking {}
