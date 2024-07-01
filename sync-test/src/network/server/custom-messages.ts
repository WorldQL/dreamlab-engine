import { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handleCustomMessages: ServerNetworkSetupRoutine = (net, _game) => {
  net.registerPacketHandler("CustomMessage", (from, packet) => {
    if (packet.to === undefined) {
      for (const listener of net.customMessageListeners) {
        try {
          const r = listener(from, packet.channel, packet.data);
          if (r instanceof Promise) {
            r.catch(err => console.warn("Error calling custom message listener: " + err));
          }
        } catch (err) {
          console.warn("Error calling custom message listener: " + err);
        }
      }
    } else if (packet.to === "*") {
      net.broadcast({
        t: "CustomMessage",
        channel: packet.channel,
        data: packet.data,
        originator: from,
      });
    } else {
      net.send(packet.to, {
        t: "CustomMessage",
        channel: packet.channel,
        data: packet.data,
        originator: from,
      });
    }
  });
};
