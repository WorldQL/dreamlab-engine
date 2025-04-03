import { Behavior, BehaviorDestroyed } from "@dreamlab/engine";
import type { Piano } from "npm:@tonejs/piano@0.2.1";

export type Note = (typeof NOTES)[number];
export const NOTES = ["C", "D", "E", "F", "G", "A", "B"] as const;
export const isNote = (note: unknown): note is Note => {
  if (typeof note !== "string") return false;
  return NOTES.includes(note as Note);
};

export type Octave = (typeof OCTAVES)[number];
export const OCTAVES = ["4"];
export const isOctave = (octave: unknown): octave is Octave => {
  if (typeof octave !== "string") return false;
  return OCTAVES.includes(octave as Octave);
};

const NETWORK_CHANNEL = "@dreamlab/piano/key";
export type NetworkData = {
  readonly direction: "press" | "release";
  readonly note: Note;
  readonly octave: Octave;
};

export default class PianoSounds extends Behavior {
  #piano: Piano | undefined;

  override async onInitialize(): Promise<void> {
    if (!this.game.isClient()) return;

    await Promise.all([import("npm:tone@^14.6.1"), import("npm:webmidi@^2.5.1")]);
    const { Piano } = await import("npm:@tonejs/piano@0.2.1");

    const piano = new Piano({
      velocities: 5,
    });

    piano.toDestination();
    await piano.load();

    this.#piano = piano;
    Object.assign(globalThis, { piano: this });
    console.clear();

    this.game.network.onReceiveCustomMessage((from, channel, data) => {
      if (channel !== NETWORK_CHANNEL) return;
      if (from === this.game.network.self) return;

      this.#play(data as NetworkData);
    });

    this.on(BehaviorDestroyed, () => {
      this.#piano?.dispose();
    });
  }

  #key(data: NetworkData): void {
    if (!this.#piano) return;
    if (!this.game.isClient()) return;

    this.game.network.broadcastCustomMessage(NETWORK_CHANNEL, data);
    this.#play(data);
  }

  #play(data: NetworkData): void {
    if (!this.#piano) return;
    if (!this.game.isClient()) return;

    const note = data.note + data.octave;
    if (data.direction === "press") this.#piano.keyDown({ note });
    else if (data.direction === "release") this.#piano.keyUp({ note });
  }

  public press({ note, octave }: { readonly note: Note; readonly octave: Octave }): void {
    this.#key({ direction: "press", note, octave });
  }

  public release({ note, octave }: { readonly note: Note; readonly octave: Octave }): void {
    this.#key({ direction: "release", note, octave });
  }
}
