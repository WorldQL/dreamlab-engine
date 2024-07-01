import { ClientNetworkSetupRoutine } from "./net-connection.ts";

export const handleCustomMessages: ClientNetworkSetupRoutine = (conn, _game) => {
  conn.registerPacketHandler("CustomMessage", packet => {
    for (const listener of conn.customMessageListeners) {
      try {
        const r = listener(packet.originator, packet.channel, packet.data);
        if (r instanceof Promise)
          r.catch(err => console.warn("Error calling custom message listener: " + err));
      } catch (err) {
        console.warn("Error calling custom message listener: " + err);
      }
    }
  });
};
