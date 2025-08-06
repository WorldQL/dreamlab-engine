import {
  AudioAdapter,
  Camera,
  Entity,
  EntityContext,
  EntityDestroyed,
  GameRender,
  Vector2,
} from "@dreamlab/engine";
import "@dreamlab/vendor/howler.ts";

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
  maxRange: number = -1;
  falloff: number = 0.8;
  stream: boolean = false;

  #howl: Howl | undefined;
  get howl(): Howl {
    if (!this.#howl) throw new Error("AudioSource is not initialized yet");
    return this.#howl;
  }

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(AudioSource, "clip", {
      type: AudioAdapter,
      description: "Audio file to play (MP3, WAV, etc).",
    });

    this.defineValue(AudioSource, "volume", {
      description: "Volume of the audio (0.0 to 1.0).",
    });

    this.defineValue(AudioSource, "loop", {
      description: "Whether the audio should loop continuously.",
    });

    this.defineValue(AudioSource, "minRange", {
      description: "Minimum distance where the audio is at full volume.",
    });

    this.defineValue(AudioSource, "maxRange", {
      description: "Maximum distance where the audio becomes inaudible. Set -1 for no falloff.",
    });

    this.defineValue(AudioSource, "falloff", {
      description: "How quickly volume decreases between min and max range.",
    });

    this.defineValue(AudioSource, "stream", {
      description: "Whether to stream the file instead of loading it fully into memory.",
    });

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

    let playingBeforePause = false;
    const pauseListener = (paused: boolean) => {
      if (paused) {
        playingBeforePause =
          (this.#howl?.playing() && this.#howl.seek() < this.#howl.duration()) ?? false;
        this.#howl?.pause();
      } else if (playingBeforePause) {
        this.#howl?.play();
      }
    };
    this.game.paused.onChanged(pauseListener);

    this.on(EntityDestroyed, () => {
      this.#howl?.unload();
      this.game.paused.removeChangeListener(pauseListener);
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
      html5: this.stream,
    });

    this.#updateHRTF();
  }

  #updateHRTF() {
    if (!this.#howl) return;
    if (this.maxRange > 0) {
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
        maxDistance: 100000,
        panningModel: "HRTF",
        refDistance: 1,
        rolloffFactor: 1,
      });
    }
  }

  #updatePosition() {
    if (!this.#howl) return;
    const camera = Camera.getActive(this.game);
    if (!camera || this.maxRange <= 0) {
      this.#howl.pos(0, 0, 0);
      return;
    }

    const { x, y } = Vector2.sub(this.interpolated.position, camera.smoothed.position);
    this.#howl.pos(x, y, 0);
  }

  onInitialize(): void {
    if (!this.game.isClient()) return;
    this.#loadClip();
  }

  #assertInitialized(): void {
    if (this.clip === "") return;
    if (!this.game.isClient()) return;
    if (!this.#howl) throw new Error("AudioSource is not initialized yet");
  }

  play(): void {
    this.#assertInitialized();
    this.#howl!.play();
  }

  stop(): void {
    this.#assertInitialized();
    this.#howl!.stop();
  }

  pause(): void {
    this.#assertInitialized();
    this.#howl!.pause();
  }
}
