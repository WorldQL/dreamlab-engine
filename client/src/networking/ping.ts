import { ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handlePing: ClientNetworkSetupRoutine = (conn, game) => {
  conn.registerPacketHandler("Ping", packet => {
    if (packet.type === "ping") {
      conn.send({ t: "Ping", type: "pong", timestamp: packet.timestamp });
    } else {
      const now = Date.now();
      conn.ping = now - packet.timestamp;
      game.fire(Ping, conn.ping);
    }
  });
};

export class Ping {
  constructor(public readonly ping: number) {}
}
