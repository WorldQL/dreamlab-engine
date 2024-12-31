import { element as elem } from "@dreamlab/ui";

export class IconPicker {
  #picker = elem("div", { className: "icon-picker" }, []);
  #container = elem("div", { className: "icon-picker-container" }, [this.#picker]);
  private onClose?: () => void;

  private bufferZone = 50;
  private isInsideBuffer = false;

  //wip
  // prettier-ignore
  private icons = [
    "📦", "⚙️", "🔧", "🛠️", "📚", 
    "📂", "📁", "💾", "🔒", "🔓",
    "🔑", "📌", "📋", "📏", "🏷️", 
    "🧰", "🔋", "🛑", "🔊", "🔍", 
    "📊", "🖥️", "🎥", "📜", "🔗", 
    "📢", "📱", "🗂️", "🌐", "🎨", 
    "🖼️", "🧵", "🔡", "🖌️", "⬜", 
    "⬛", "🔲", "🔳", "⬆️", "⬇️", 
    "⬅️", "➡️", "🔺", "🔻", "🔶", 
    "🔷", "🔵", "⚪", "⚫", "◼️", 
    "◻️", "♦️", "🔸", "🔹", "🔘", 
    "🔴", "🟢", "🟡", "🟠", "🌍", 
    "🏔️", "🏠", "🌳", "🔥", "🌊", 
    "🌌", "🏜️", "🌋", "🌉", "🏃", 
    "🛡️", "⚔️", "🔮", "🎯", "💀", 
    "🌀", "⚡", "💥", "⭐", "⚖️", 
    "🛞", "🗝️", "🗑️", "🔦", "🧱", 
    "🪚", "🪛", "🪓", "🪜", "✏️", 
    "🖊️", "🔨", "⚒️", "⛏️", "📡", 
    "📶", "🧲", "🔩", "⏳", "⏰", 
    "⏱️", "⏲️", "🕛", "🕒", "🕝", 
    "🕞", "🕰️", "🔌", "💡", "🔅", 
    "🔆", "↔️", "↕️", "🔄", "🔁", 
    "🔃", "⤴️", "⤵️", "📐", "🔬", 
    "🎛️", "🧮",
  ];

  constructor(public onSelect: (icon: string) => void) {}

  open(x: number, y: number, onClose?: () => void) {
    this.onClose = onClose;
    this.#picker.innerHTML = "";

    this.icons.forEach(icon => {
      const iconButton = elem("button", { className: "icon-button" }, [icon]);
      iconButton.addEventListener("click", () => {
        this.onSelect(icon);
        this.close();
      });
      this.#picker.append(iconButton);
    });

    document.body.append(this.#container);

    this.adjustPosition(x, y);

    this.#container.addEventListener("mouseleave", this.handleMouseLeave);
    document.addEventListener("mousemove", this.handleMouseMove);
  }

  close() {
    this.#container.remove();
    this.#container.removeEventListener("mouseleave", this.handleMouseLeave);
    document.removeEventListener("mousemove", this.handleMouseMove);
    if (this.onClose) this.onClose();
  }

  private handleMouseLeave = () => {
    if (!this.isInsideBuffer) {
      this.close();
    }
  };

  private handleMouseMove = (event: MouseEvent) => {
    const rect = this.#container.getBoundingClientRect();
    const isWithinX =
      event.clientX >= rect.left - this.bufferZone &&
      event.clientX <= rect.right + this.bufferZone;
    const isWithinY =
      event.clientY >= rect.top - this.bufferZone &&
      event.clientY <= rect.bottom + this.bufferZone;

    this.isInsideBuffer = isWithinX && isWithinY;
    if (!this.isInsideBuffer) {
      this.close();
    }
  };

  private adjustPosition(x: number, y: number) {
    const { clientWidth, clientHeight } = document.documentElement;
    const containerRect = this.#container.getBoundingClientRect();

    let adjustedX = x;
    let adjustedY = y;

    if (x + containerRect.width > clientWidth) {
      adjustedX = clientWidth - containerRect.width - 10;
    }

    if (y + containerRect.height > clientHeight) {
      adjustedY = clientHeight - containerRect.height - 10;
    }

    this.#container.style.left = `${Math.max(adjustedX, 10)}px`;
    this.#container.style.top = `${Math.max(adjustedY, 10)}px`;
  }
}
