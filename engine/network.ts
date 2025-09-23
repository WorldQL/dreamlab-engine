export type ConnectionId = "server" | (string & Record<never, never>); // LiteralUnion<'server', string>
// deno-lint-ignore no-explicit-any
export type CustomMessageData = any;

export type CustomMessageListener = (
  from: ConnectionId,
  channel: string,
  data: CustomMessageData,
) => void | Promise<void>;

export interface ConnectionInfo {
  readonly id: ConnectionId;
  readonly playerId: string;
  readonly nickname: string;
}

export interface BaseNetworking {
  get self(): ConnectionId;
  get connections(): ConnectionInfo[];
  connection(id: string): ConnectionInfo | undefined;
  sendCustomMessage(to: ConnectionId, channel: string, data: CustomMessageData): void;
  broadcastCustomMessage(channel: string, data: CustomMessageData): void;
  onReceiveCustomMessage(listener: CustomMessageListener): void;
  disconnect(): void;
}

export interface ClientNetworking extends BaseNetworking {
  readonly ping: number;
  get selfInfo(): ConnectionInfo;
}
export interface ServerNetworking extends BaseNetworking {}
