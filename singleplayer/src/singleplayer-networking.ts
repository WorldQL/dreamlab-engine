// the requirements for singleplayer networking are just "we receive our own custom messages",

import {
  ClientNetworking,
  ConnectionId,
  ConnectionInfo,
  CustomMessageData,
  CustomMessageListener,
} from "@dreamlab/engine";

// TODO: what do we do about player-scoped kv
const SINGLEPLAYER_PLAYER_ID = "ply_singleplayer";
const SINGLEPLAYER_CONNECTION_ID = "conn_singleplayer";
const SINGLEPLAYER_NICKNAME = "Player";

export class SingleplayerNetworking {
  customMessageListeners: CustomMessageListener[] = [];

  createNetworking(): ClientNetworking {
    // deno-lint-ignore no-this-alias
    const conn = this;

    return {
      get ping() {
        return 0;
      },
      get self() {
        return SINGLEPLAYER_CONNECTION_ID;
      },
      get selfInfo() {
        return {
          id: SINGLEPLAYER_CONNECTION_ID,
          nickname: SINGLEPLAYER_NICKNAME,
          playerId: SINGLEPLAYER_PLAYER_ID,
        };
      },
      get connections(): ConnectionInfo[] {
        return [
          {
            id: SINGLEPLAYER_CONNECTION_ID,
            nickname: SINGLEPLAYER_NICKNAME,
            playerId: SINGLEPLAYER_PLAYER_ID,
          },
        ];
      },
      sendCustomMessage(to: ConnectionId, channel: string, data: CustomMessageData) {
        queueMicrotask(() => {
          if (to === "*" || to === this.self) {
            for (const listener of conn.customMessageListeners) {
              listener(this.self, channel, data);
            }
          }
        });
      },
      broadcastCustomMessage(channel: string, data: CustomMessageData) {
        this.sendCustomMessage("*", channel, data);
      },
      onReceiveCustomMessage(listener: CustomMessageListener) {
        conn.customMessageListeners.push(listener);
      },
      disconnect() {},
    };
  }
}
