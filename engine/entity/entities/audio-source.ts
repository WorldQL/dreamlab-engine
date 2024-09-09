import { Howl } from "@dreamlab/vendor/howler.ts";
import { Vector2 } from "../../math/mod.ts";
import { GameRender } from "../../signals/mod.ts";
import { AudioAdapter } from "../../value/adapters/audio-adapter.ts";
import { Entity, EntityContext } from "../entity.ts";
import { Camera } from "./camera.ts";

export class AudioSource extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🔊";
  readonly bounds = undefined;

  clip: string = "";
  volume: number = 1;
  loop: boolean = false;
  minRange: number = 0.2;
  maxRange: number = Number.POSITIVE_INFINITY;
  falloff: number = 0.8;

  #howl: Howl | undefined;

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(AudioSource, "clip", { type: AudioAdapter });
    this.defineValues(AudioSource, "volume", "loop", "minRange", "maxRange", "falloff");

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

    const minRangeValue = this.values.get("minRange");
    minRangeValue?.onChanged(() => this.#updateHRTF());
    const maxRangeValue = this.values.get("maxRange");
    maxRangeValue?.onChanged(() => this.#updateHRTF());
    const falloffValue = this.values.get("falloff");
    falloffValue?.onChanged(() => this.#updateHRTF());

    this.listen(this.game, GameRender, () => {
      this.#updatePosition();
    });
  }

  #loadClip() {
    this.#howl = undefined;
    if (!this.game.isClient()) return;
    if (this.clip === "") return;

    this.#howl = new Howl({
      src: [this.game.resolveResource(this.clip)],
      volume: this.volume,
      loop: this.loop,
      preload: "metadata",
    });

    this.#updateHRTF();
  }

  #updateHRTF() {
    if (!this.#howl) return;
    if (Number.isFinite(this.maxRange)) {
      this.#howl.pannerAttr({
        coneInnerAngle: 360,
        coneOuterAngle: 360,
        coneOuterGain: 0,
        maxDistance: this.maxRange,
        panningModel: "HRTF",
        refDistance: this.minRange,
        rolloffFactor: this.falloff,
        distanceModel: "inverse",
      });
    } else {
      this.#howl.pannerAttr({
        coneInnerAngle: 360,
        coneOuterAngle: 360,
        coneOuterGain: 0,
        distanceModel: "inverse",
        maxDistance: 10000,
        panningModel: "HRTF",
        refDistance: 1,
        rolloffFactor: 1,
      });
    }
  }

  #updatePosition() {
    if (!this.#howl) return;
    const camera = Camera.getActive(this.game);
    if (!camera || !Number.isFinite(this.maxRange)) {
      this.#howl.pos(0, 0, 0);
      return;
    }

    const { x, y } = Vector2.sub(this.pos, camera.interpolated.position);
    this.#howl.pos(x, y, 0);
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
