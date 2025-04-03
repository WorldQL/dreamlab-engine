import type { Entity } from "@dreamlab/engine";
import { EntityRef, UIBehavior, syncedValue } from "@dreamlab/engine";
import type { BaseElement } from "@dreamlab/ui";
import PianoSounds, { NOTES, OCTAVES, isNote, isOctave } from "./piano-sounds.ts";

export default class PianoUI extends UIBehavior {
  @syncedValue(EntityRef)
  public piano: Entity | undefined;
  get #piano(): PianoSounds {
    const piano = this.piano?.getBehavior(PianoSounds);
    if (!piano) throw new Error("missing piano behavior");

    return piano;
  }

  #mouseDown = false;
  protected override render(): BaseElement {
    const getKey = (ev: MouseEvent) => {
      const target = ev.target as HTMLDivElement;
      const note = target.closest<HTMLDivElement>("[data-note]")?.dataset.note;
      const octave = target.closest<HTMLDivElement>("[data-octave]")?.dataset.octave;

      if (!isNote(note) || !isOctave(octave)) return;
      return { note, octave };
    };

    const onMouse = (ev: MouseEvent) => {
      const key = getKey(ev);
      if (!key) return;

      if (ev.type === "mousedown") {
        this.#piano.press(key);
        this.#mouseDown = true;
      } else if (ev.type === "mouseup") {
        this.#piano.release(key);
        this.#mouseDown = false;
      }
    };

    const onMouseHover = (ev: MouseEvent) => {
      const key = getKey(ev);
      if (!key) return;

      if (ev.type === "mouseout") {
        this.#piano.release(key);
      } else if (ev.type === "mouseover" && this.#mouseDown) {
        this.#piano.press(key);
      }
    };

    return (
      <div
        onMouseDown={onMouse}
        onMouseUp={onMouse}
        onMouseOver={onMouseHover}
        onMouseOut={onMouseHover}
        style={{ userSelect: "none" }}
      >
        {OCTAVES.map(octave => (
          <div data-octave={octave}>
            {NOTES.map(note => (
              <div data-note={note}>
                {note}
                {octave}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
}
