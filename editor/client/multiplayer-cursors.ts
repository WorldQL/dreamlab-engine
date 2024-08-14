import { ClientGame } from "@dreamlab/engine";
import { elem } from "@dreamlab/ui";
import { PlayerConnectionDropped } from "@dreamlab/proto/common/signals.ts";

export function setupMultiplayerCursors(game: ClientGame) {
  // this is silly but i love it so much fdhjksg

  const cursors = new Map<string, HTMLElement>();

  game.network.onReceiveCustomMessage((from, channel, data) => {
    if (from === game.network.self) return;
    if (channel !== "multiplayer-cursors") return;

    if (!cursors.has(from)) {
      const cursor = elem("div", { className: "multiplayer-cursor" });
      cursor.innerHTML = `<?xml version="1.0" encoding="utf-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.1" d="M10.448 17.184L8.09782 10.6557C7.52461 9.06344 9.06479 7.52326 10.657 8.09647L17.1853 10.4467C19.1195 11.143 18.8709 13.9539 16.8445 14.2999L16.0686 14.4324C15.2319 14.5752 14.5766 15.2306 14.4337 16.0672L14.3013 16.8431C13.9553 18.8695 11.1443 19.1181 10.448 17.184Z" fill="currentColor"/>
<path d="M10.4465 17.1843L8.09636 10.656C7.52315 9.0638 9.06333 7.52363 10.6556 8.09684L17.1839 10.447C19.118 11.1433 18.8694 13.9543 16.843 14.3003L16.0671 14.4327C15.2305 14.5756 14.5751 15.231 14.4323 16.0676L14.2998 16.8435C13.9538 18.8699 11.1428 19.1185 10.4465 17.1843Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
      cursor.style.position = "absolute";
      cursor.style.zIndex = "99";
      cursor.style.maxWidth = "100%";

      const svgElem = cursor.querySelector("svg")!;

      const nickname = game.network.connections.find(c => c.id === from)?.nickname ?? from;
      const nicknameElem = elem("span", { className: "nickname" }, [nickname]);
      nicknameElem.style.display = "inline-block";
      nicknameElem.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      nicknameElem.style.padding = "0.5em";
      nicknameElem.style.borderRadius = "4px";

      // from stackoverflow lol
      const cyrb53 = (str: string, seed = 0) => {
        let h1 = 0xdeadbeef ^ seed,
          h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
          ch = str.charCodeAt(i);
          h1 = Math.imul(h1 ^ ch, 2654435761);
          h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
      };

      const color = `hsl(${((cyrb53(from) % 16) / 8) * 138.5}, 100%, 75%)`;
      svgElem.style.color = color;
      nicknameElem.style.color = color;

      cursor.append(nicknameElem);

      document.body.append(cursor);

      cursors.set(from, cursor);
    }

    const cursor = cursors.get(from)!;

    const { x, y } = data as { x: number; y: number };
    cursor.style.top = `${y}%`;
    cursor.style.left = `${x}%`;
  });

  game.on(PlayerConnectionDropped, ({ connection }) => {
    cursors.get(connection.id)?.remove();
    cursors.delete(connection.id);
  });

  document.addEventListener("mousemove", event => {
    const x = event.clientX / (window.innerWidth / 100);
    const y = event.clientY / (window.innerHeight / 100);
    game.network.broadcastCustomMessage("multiplayer-cursors", { x, y });
  });
}
