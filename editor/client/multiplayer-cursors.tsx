import { Camera, ClientGame, ConnectionId, PlayerLeft } from "@dreamlab/engine";
import { EntityReferenceSchema, Vector2Schema } from "@dreamlab/proto/datamodel.ts";
import { BaseElement } from "@dreamlab/ui";
import * as z from "@dreamlab/vendor/zod.ts";

export const MultiplayerCursorPacketSchema = z.discriminatedUnion("t", [
  z.object({ t: z.literal("edit-game"), world: Vector2Schema }),
  z.object({ t: z.literal("play-game"), world: Vector2Schema }),
  z.object({ t: z.literal("scene-graph"), entity: EntityReferenceSchema, pct: Vector2Schema }),
  z.object({
    t: z.literal("behavior-menu"),
    entity: EntityReferenceSchema,
    valueIdentifier: z.string(),
    pct: Vector2Schema,
  }),
]);
export type MultiplayerCursorPacket = z.infer<typeof MultiplayerCursorPacketSchema>;

interface MultiplayerCursor {
  position: MultiplayerCursorPacket;
  element: BaseElement;
}

export class MultiplayerCursors {
  static UPDATE_RATE_HZ = 20;

  container = (<div id="multiplayer-cursors" />);
  cursors = new Map<ConnectionId, MultiplayerCursor>();

  playGame: ClientGame | undefined;

  constructor(
    private game: ClientGame,
    private uiRoot: HTMLElement,
  ) {
    uiRoot.append(this.container);

    game.network.onReceiveCustomMessage((from, channel, data) => {
      if (channel !== "@dreamlab/multiplayer-cursors") return;
      if (from === game.network.self) return;

      const result = MultiplayerCursorPacketSchema.safeParse(data);
      if (result.success) this.update(from, result.data);
    });

    game.on(PlayerLeft, ({ connection }) => {
      const cursor = this.cursors.get(connection.id);
      if (!cursor) return;
      cursor.element.remove();
      this.cursors.delete(connection.id);
    });

    document.addEventListener("pointermove", ev => {
      const packet = this.locateCursor(
        ev.clientX,
        ev.clientY,
        ev.target instanceof Element ? ev.target : undefined,
      );
      if (!packet) return;
      game.network.broadcastCustomMessage("@dreamlab/multiplayer-cursors", packet);
    });

    setInterval(() => this.repositionCursors(), 1000 / MultiplayerCursors.UPDATE_RATE_HZ);
  }

  update(from: ConnectionId, packet: MultiplayerCursorPacket) {
    let cursor = this.cursors.get(from);
    if (!cursor) {
      cursor = {
        position: packet,
        element: (
          <div className="multiplayer-cursor" data-conn={from} ariaHidden="true">
            <svg width="24px" height="24px" viewBox="0 0 24 24">
              <path
                opacity="0.1"
                d="M10.448 17.184L8.09782 10.6557C7.52461 9.06344 9.06479 7.52326 10.657 8.09647L17.1853 10.4467C19.1195 11.143 18.8709 13.9539 16.8445 14.2999L16.0686 14.4324C15.2319 14.5752 14.5766 15.2306 14.4337 16.0672L14.3013 16.8431C13.9553 18.8695 11.1443 19.1181 10.448 17.184Z"
                fill="currentColor"
              />
              <path
                d="M10.4465 17.1843L8.09636 10.656C7.52315 9.0638 9.06333 7.52363 10.6556 8.09684L17.1839 10.447C19.118 11.1433 18.8694 13.9543 16.843 14.3003L16.0671 14.4327C15.2305 14.5756 14.5751 15.231 14.4323 16.0676L14.2998 16.8435C13.9538 18.8699 11.1428 19.1185 10.4465 17.1843Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        ) as BaseElement,
      };
      this.cursors.set(from, cursor);
      this.container.append(cursor.element);
    } else {
      cursor.position = packet;
    }

    this.repositionCursors();
  }

  locateCursor(
    x: number,
    y: number,
    element: Element | undefined,
  ): MultiplayerCursorPacket | undefined {
    if (!element) return;

    const canvas = element.closest("canvas");
    if (canvas && canvas === this.game.renderer.app.canvas) {
      const camera = Camera.getActive(this.game);
      if (camera) {
        const canvasRect = canvas.getBoundingClientRect();
        const screenspacePos = { x: x - canvasRect.x, y: y - canvasRect.y };
        return {
          t: "edit-game",
          world: camera.screenToWorld(screenspacePos),
        };
      }
    }

    const entityEntry = element.closest("details[data-entity]") as HTMLDetailsElement | null;
    if (entityEntry) {
      const rect = entityEntry.getBoundingClientRect();
      return {
        t: "scene-graph",
        entity: entityEntry.dataset.entity!,
        pct: { x: (x - rect.x) / rect.width, y: (y - rect.y) / rect.height },
      };
    }

    return undefined;
    // TODO
  }

  repositionCursors() {
    for (const [from, { position, element }] of this.cursors.entries()) {
      switch (position.t) {
        case "edit-game": {
          const activeCamera = Camera.getActive(this.game);
          if (!activeCamera) continue;
          const viewportRect = this.game.renderer.app.canvas.getBoundingClientRect();
          const canvasPos = activeCamera.worldToScreen(position.world);

          // TODO: clamp canvasPos to viewportRect bounds

          element.style.setProperty("--pos-x", viewportRect.x + canvasPos.x + "px");
          element.style.setProperty("--pos-y", viewportRect.y + canvasPos.y + "px");

          break;
        }
        case "scene-graph": {
          const anchorElement = this.uiRoot.querySelector(
            `#scene-graph [data-entity="${position.entity}"]`,
          );
          if (!anchorElement) continue;

          // TODO: figure out the closest open one and clamp to bottom of its rect

          const rect = anchorElement.getBoundingClientRect();

          element.style.setProperty("--pos-x", rect.x + rect.width * position.pct.x + "px");
          element.style.setProperty("--pos-y", rect.y + rect.height * position.pct.y + "px");

          break;
        }
        // TODO: play-game, behavior-menu
      }
    }
  }
}
