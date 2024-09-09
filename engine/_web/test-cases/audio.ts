import { AudioSource, Behavior, Sprite } from "@dreamlab/engine";
import WASDMovementBehavior from "../../behavior/behaviors/wasd-movement-behavior.ts";

class PlaySoundBehavior extends Behavior {
  #source = this.entity.cast(AudioSource);
  #play = this.inputs.create("play", "Play Sound", "Space");

  onTick() {
    if (this.#play.pressed) this.#source.play();
  }
}

export const source = game.world.spawn({
  type: AudioSource,
  name: AudioSource.name,
  values: { clip: "http://localhost:3000/test.ogg", maxRange: 20, minRange: 0.1, falloff: 0.1 },
  transform: { scale: { x: 0.2, y: 0.2 } },
  behaviors: [{ type: PlaySoundBehavior }],
  children: [{ type: Sprite, name: Sprite.name }],
});

// move source
source.addBehavior({ type: WASDMovementBehavior });

// move camera
// camera.addBehavior({ type: WASDMovementBehavior });
