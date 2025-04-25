import { Click, Entity, EntityRef, syncedValue, UIBehavior } from "@dreamlab/engine";
import type { BaseElement } from "@dreamlab/ui";
import PowerupManager from "./powerup-manager.ts";
import type { PowerupType } from "./powerup.ts";

const POWERUP_NAMES = {
  "speed-boost": "Speed Boost",
  stun: "Stun",
  obstacle: "Obstacle",
} as const satisfies Record<PowerupType, string>;

export default class PowerupUI extends UIBehavior {
  @syncedValue(EntityRef)
  manager: Entity | undefined;

  get #manager(): PowerupManager {
    const manager = this.manager?.getBehaviorIfExists(PowerupManager);
    if (!manager) throw new Error("missing powerup manager");

    return manager;
  }

  onInitialize(): void {
    super.onInitialize();

    this.listen(this.inputs, Click, ({ cursor }) => {
      this.#manager.spawn(this.#selected, cursor.world);
    });
  }

  #selected: PowerupType = "speed-boost";
  protected render(): BaseElement {
    // TODO
    const onChecked = (ev: Event) => {
      const target = ev.target as HTMLInputElement;
      this.#selected = target.value as PowerupType;
    };

    return (
      <div>
        {Object.entries(POWERUP_NAMES).map(([t, name]) => (
          <div>
            <input
              type="radio"
              name="powerup-type"
              id={t}
              value={t}
              checked={t === this.#selected}
              onChange={onChecked}
            />

            <label htmlFor={t}>{name}</label>
          </div>
        ))}
      </div>
    );
  }
}
