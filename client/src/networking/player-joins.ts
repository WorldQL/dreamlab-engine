import { PlayerJoined, PlayerLeft } from "@dreamlab/engine";
import {
  PlayerConnectionDropped,
  PlayerConnectionEstablished,
} from "@dreamlab/proto/common/signals.ts";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handlePlayerJoins: ClientNetworkSetupRoutine = (conn, game) => {
  conn.registerPacketHandler("PeerListSnapshot", packet => {
    conn.peers.clear();
    for (const peer of packet.peers) {
      conn.peers.set(peer.connection_id, {
        id: peer.connection_id,
        nickname: peer.nickname,
        playerId: peer.player_id,
      });
    }
  });
  conn.registerPacketHandler("PeerConnected", packet => {
    const peerInfo = {
      id: packet.connection_id,
      nickname: packet.nickname,
      playerId: packet.player_id,
    };
    conn.peers.set(packet.connection_id, peerInfo);
    game.fire(PlayerConnectionEstablished, peerInfo);
  });
  conn.registerPacketHandler("PeerDisconnected", packet => {
    const peerInfo = conn.peers.get(packet.connection_id);
    conn.peers.delete(packet.connection_id);
    if (peerInfo) {
      game.fire(PlayerConnectionDropped, peerInfo);
      game.fire(PlayerLeft, peerInfo);
    }
  });
  conn.registerPacketHandler("PlayerJoined", packet => {
    const peerInfo = conn.peers.get(packet.connection_id);
    if (peerInfo) game.fire(PlayerJoined, peerInfo);
  });
  conn.registerPacketHandler("PeerChangedNickname", packet => {
    const peer = conn.peers.get(packet.connection_id);
    if (!peer) return;
    peer.nickname = packet.new_nickname;
  });
};
