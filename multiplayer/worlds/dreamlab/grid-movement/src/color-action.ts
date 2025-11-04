import { Behavior, Entity, EntityRef, Tilemap, value } from "@dreamlab/engine";
import { Colors } from "../lib/colors.ts";
import { PlayerMoved } from "./player-movement.ts";

export default class ColorAction extends Behavior {
  @value({ type: EntityRef })
  tilemap: Entity | undefined;

  onInitialize(): void {
    const tilemap = this.tilemap?.cast(Tilemap);
    if (!tilemap) throw new Error("missing tilemap");

    this.listen(this.game, PlayerMoved, ev => {
      const tile = tilemap.getColor(ev.position.x, ev.position.y);
      if (tile === undefined) return;
      this.#onTile(tile, ev);
    });
  }

  #onTile(color: number, ev: PlayerMoved): void {
    switch (color) {
      case Colors.Water: {
        ev.delay += 10;
        break;
      }

      case Colors.Sand: {
        ev.delay += 5;
        break;
      }

      case Colors.Grass: {
        if (Math.random() > 0.8) {
          console.log("random encounter!!");
        }

        break;
      }
    }
  }
}
