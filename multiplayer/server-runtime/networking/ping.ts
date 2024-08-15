import { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handlePing: ServerNetworkSetupRoutine = (net, _game) => {
  net.registerPacketHandler("Ping", (from, packet) => {
    if (packet.type === "ping") {
      net.send(from, { t: "Ping", type: "pong", timestamp: packet.timestamp });
    }
  });
};
