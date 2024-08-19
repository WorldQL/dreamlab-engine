export class ButtonGroup extends HTMLElement {
  static {
    customElements.define("dreamlab-button-group", this);
  }

  constructor(direction: `${"row" | "column"}${"" | "-reverse"}`) {
    super();
    this.dataset.direction = direction;
  }
}
