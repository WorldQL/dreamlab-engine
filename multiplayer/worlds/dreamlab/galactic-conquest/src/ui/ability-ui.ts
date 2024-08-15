import { Behavior, GamePostRender, UILayer } from "@dreamlab/engine";
import { __deprecated__element as element } from "@dreamlab/ui";
import Shield from "../power-ups/shield.ts";
import Supercharge from "../power-ups/supercharge.ts";

export default class AbilityUI extends Behavior {
  #ui = this.entity.cast(UILayer);
  #abilities!: HTMLDivElement;
  #shieldImage!: HTMLImageElement;
  #shieldCooldown!: HTMLSpanElement;
  #boostImage!: HTMLImageElement;
  #boostCooldown!: HTMLSpanElement;

  onInitialize() {
    const css = `
#abilities {
  position: absolute;
  bottom: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  color: white;
  font-family: "Inter", sans-serif;
  background-color: rgb(0 0 0 / 50%);
  padding: 0.5rem;
  border-radius: 0.4rem;
  user-select: none;
}
.ability {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.ability img {
  width: 50px;
  height: 50px;
  filter: grayscale(100%);
}
.ability img.ready {
  filter: none;
}
.cooldown {
  font-size: 0.75rem;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: red;
  font-weight: bold;
  font-size: 1.2rem;
}
.ability-title {
  font-size: 1rem;
  margin-bottom: 0.2rem;
}
.ability-keycode {
  font-size: 0.75rem;
  margin-top: 0.2rem;
}
`;

    const style = element("style", { children: [css] });
    this.#ui.dom.appendChild(style);

    this.#abilities = element("div", { id: "abilities" });
    this.#ui.element.appendChild(this.#abilities);

    const shieldUI = this.#createAbilityUI(
      "(Space)",
      "SHIELD",
      "res://assets/shield_ability.png",
    );
    this.#shieldImage = shieldUI.image;
    this.#shieldCooldown = shieldUI.cooldown;

    const boostUI = this.#createAbilityUI(
      "(Right Click)",
      "SUPER",
      "res://assets/supercharge_ability.png",
    );
    this.#boostImage = boostUI.image;
    this.#boostCooldown = boostUI.cooldown;

    this.listen(this.game, GamePostRender, () => {
      this.#updateCooldowns();
    });
  }

  #createAbilityUI(key: string, name: string, imagePath: string) {
    const image = element("img", { props: { src: this.game.resolveResource(imagePath) } });
    const cooldown = element("span", { classList: ["cooldown"] });

    const ability = element("div", {
      classList: ["ability"],
      children: [
        element("div", { classList: ["ability-title"], children: [name] }),
        image,
        element("div", { classList: ["ability-keycode"], children: [key] }),
        cooldown,
      ],
    });

    this.#abilities.appendChild(ability);

    return { image, cooldown };
  }

  #updateCooldowns() {
    const player = this.entity.game.world.children.get("Player");
    if (!player) return;

    const shieldBehavior = player.getBehavior(Shield);
    const boostBehavior = player.getBehavior(Supercharge);

    this.#updateAbilityCooldown(
      this.#shieldImage,
      this.#shieldCooldown,
      shieldBehavior.isCoolingDown,
      shieldBehavior.cooldown,
      shieldBehavior.coolingDownTime,
    );

    this.#updateAbilityCooldown(
      this.#boostImage,
      this.#boostCooldown,
      boostBehavior.isCoolingDown,
      boostBehavior.cooldown,
      boostBehavior.coolingDownTime,
    );
  }

  #updateAbilityCooldown(
    image: HTMLImageElement,
    cooldownSpan: HTMLSpanElement,
    isCoolingDown: boolean,
    cooldownTime: number,
    coolingDownTime: number,
  ) {
    if (isCoolingDown) {
      image.classList.remove("ready");
      const remainingTime = Math.ceil((coolingDownTime + cooldownTime - Date.now()) / 1000);
      cooldownSpan.innerText = remainingTime.toString();
    } else {
      image.classList.add("ready");
      cooldownSpan.innerText = "";
    }
  }
}
