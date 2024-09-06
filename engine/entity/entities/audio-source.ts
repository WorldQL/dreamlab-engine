import { Howl } from "@dreamlab/vendor/howler.ts";
import { AudioAdapter } from "../../value/adapters/audio-adapter.ts";
import { Entity, EntityContext } from "../entity.ts";

export class AudioSource extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🔊";
  readonly bounds = undefined;

  clip: string = "";
  global: boolean = true; // TODO: spatial audio
  volume: number = 1;
  loop: boolean = false;

  #howl: Howl | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(AudioSource, "clip", { type: AudioAdapter });
    this.defineValues(AudioSource, "global", "volume", "loop");

    const clipValue = this.values.get("clip");
    clipValue?.onChanged(() => {
      this.#loadClip();
    });

    const volumeValue = this.values.get("volume");
    volumeValue?.onChanged(() => {
      if (this.#howl) this.#howl.volume(this.volume);
    });

    const loopValue = this.values.get("loop");
    loopValue?.onChanged(() => {
      if (this.#howl) this.#howl.loop(this.loop);
    });
  }

  #loadClip() {
    this.#howl = undefined;
    if (this.clip === "") return;

    this.#howl = new Howl({
      src: [this.game.resolveResource(this.clip)],
      volume: this.volume,
      loop: this.loop,
    });
  }

  onInitialize(): void {
    if (!this.game.isClient()) return;
    this.#loadClip();
  }

  play(): void {
    if (this.clip === "") return;
    if (!this.game.isClient()) return;
    if (!this.#howl) throw new Error("AudioSource is not initialized yet");

    this.#howl.play();
  }
}
