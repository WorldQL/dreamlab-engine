import { Behavior } from "../../../../behavior/mod.ts";
import { UILayer } from "../../../../entity/mod.ts";
import { GamePostRender } from "../../../../signals/mod.ts";
import { Shield } from "../behaviors/shield.ts";
import { Supercharge } from "../behaviors/supercharge.ts";

export class AbilityUI extends Behavior {
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

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    this.#ui.root.appendChild(style);

    this.#abilities = document.createElement("div");
    this.#abilities.id = "abilities";
    this.#ui.element.appendChild(this.#abilities);

    const shieldUI = this.#createAbilityUI(
      "(Space)",
      "SHIELD",
      "https://files.codedred.dev/shield_ability.png",
    );
    this.#shieldImage = shieldUI.image;
    this.#shieldCooldown = shieldUI.cooldown;

    const boostUI = this.#createAbilityUI(
      "(Right Click)",
      "SUPER",
      "https://files.codedred.dev/supercharge_ability.png",
    );
    this.#boostImage = boostUI.image;
    this.#boostCooldown = boostUI.cooldown;

    this.listen(this.game, GamePostRender, () => {
      this.#updateCooldowns();
    });
  }

  #createAbilityUI(key: string, name: string, imagePath: string) {
    const ability = document.createElement("div");
    ability.classList.add("ability");

    const title = document.createElement("div");
    title.classList.add("ability-title");
    title.innerText = name;
    ability.appendChild(title);

    const image = document.createElement("img");
    image.src = imagePath;
    ability.appendChild(image);

    const keycode = document.createElement("div");
    keycode.classList.add("ability-keycode");
    keycode.innerText = key;
    ability.appendChild(keycode);

    const cooldown = document.createElement("span");
    cooldown.classList.add("cooldown");
    ability.appendChild(cooldown);

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
