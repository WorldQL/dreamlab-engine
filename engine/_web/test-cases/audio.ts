import {
  AudioSource,
  Behavior,
  Click,
  ClickableRect,
  Entity,
  EntityByRefAdapter,
  Sprite,
} from "@dreamlab/engine";

class PlaySoundBehavior extends Behavior {
  #clickable = this.entity.cast(ClickableRect);
  source: Entity | undefined;

  onInitialize(): void {
    this.defineValue(PlaySoundBehavior, "source", { type: EntityByRefAdapter });

    this.listen(this.#clickable, Click, () => {
      this.source?.cast(AudioSource).play();
    });
  }
}

export const source = game.world.spawn({
  type: AudioSource,
  name: AudioSource.name,
  values: { clip: "http://localhost:3000/test.ogg" },
});

export const button = game.world.spawn({
  type: ClickableRect,
  name: ClickableRect.name,
  children: [{ type: Sprite, name: Sprite.name }],
  behaviors: [{ type: PlaySoundBehavior, values: { source } }],
});
