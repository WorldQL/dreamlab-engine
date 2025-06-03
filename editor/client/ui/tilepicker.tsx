import { DreamlabEditorUIComponent } from "./_component.tsx";

/**
 * TilePicker
 * - Overlays a 16×16 selectable grid on top of an image
 * - Highlights a cell on hover
 * - Allows mouse‑driven pan (drag) and zoom (wheel) with no external libs
 */
export class TilePicker extends DreamlabEditorUIComponent {
  private scale = 1;
  private pos = { x: 0, y: 0 };
  private isDragging = false;
  private start = { x: 0, y: 0 };

  constructor() {
    super();

    // Defer DOM‑dependent setup until after render() has mounted.
    setTimeout(() => {
      this.buildGrid();
      this.attachPanZoom();
      this.updateTransform();
    }, 0);
  }

  /** Build the 16×16 overlay grid */
  private buildGrid() {
    const grid = this.container.querySelector<HTMLDivElement>(".grid");
    if (!grid) return;

    const SIZE = 16;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.style.gridRowStart = String(r + 1);
        cell.style.gridColumnStart = String(c + 1);
        grid.appendChild(cell);
      }
    }
  }

  /** Wire up panning (drag) and zooming (wheel) */
  private attachPanZoom() {
    const wrapper = this.container.querySelector<HTMLDivElement>(".image-wrapper");
    if (!wrapper) return;

    console.log('here')

    // ---- Drag ----
    wrapper.addEventListener("mousedown", e => {
      this.isDragging = true;
      wrapper.classList.add("grabbing");
      this.start = { x: e.clientX - this.pos.x, y: e.clientY - this.pos.y };
    });

    window.addEventListener("mousemove", e => {
      if (!this.isDragging) return;
      this.pos.x = e.clientX - this.start.x;
      this.pos.y = e.clientY - this.start.y;
      this.updateTransform();
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
      wrapper.classList.remove("grabbing");
    });

    // ---- Zoom ----
    wrapper.addEventListener(
      "wheel",
      e => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.scale = Math.min(4, Math.max(0.5, this.scale + delta));
        this.updateTransform();
      },
      { passive: false },
    );
  }

  /** Apply translate + scale transform */
  private updateTransform() {
    const wrapper = this.container.querySelector<HTMLDivElement>(".image-wrapper");
    if (wrapper) {
      wrapper.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px) scale(${this.scale})`;
    }
  }

  render() {
    const style = `
.tile-picker {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  cursor: grab;
}
.image-wrapper.grabbing { cursor: grabbing; }

.image-wrapper img {
  display: block;
  user-select: none;
  pointer-events: none; /* image shouldn't capture mouse */
}

.grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  grid-template-rows: repeat(16, 1fr);
  pointer-events: none; /* allow drag through gaps; cells enable hover */
}

.cell {
  pointer-events: auto;
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: background 0.1s;
}
.cell:hover {
  background: rgba(255, 255, 255, 0.35);
}
    `;

    return (
      <div className="tile-picker" id="tile-picker-root">
        <style>{style}</style>
        <div className="image-wrapper">
          <img src="https://i.imgur.com/X7HZdaQ.png" />
          <div className="grid"></div>
        </div>
      </div>
    );
  }
}
