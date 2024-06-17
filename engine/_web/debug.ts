const controls = document.createElement("div");
controls.style.display = "grid";
controls.style.rowGap = "0.2rem";
controls.style.columnGap = "0.5rem";
controls.style.gridTemplateColumns = "repeat(3, max-content)";

let controlsAdded = false;
const addControls = () => {
  if (controlsAdded) return;
  controlsAdded = true;

  document.body.appendChild(controls);
};

export const slider = (
  {
    label,
    value = 0,
    min = 0,
    max = 1,
    step = 0.01,
  }: {
    label: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
  },
  onChanged: (value: number) => void,
) => {
  addControls();

  const span = document.createElement("span");
  span.innerText = label;

  const display = document.createElement("span");
  display.innerText = value.toString();

  const input = document.createElement("input");
  input.type = "range";
  input.value = value.toString();
  input.min = min.toString();
  input.max = max.toString();
  input.step = step.toString();
  input.addEventListener("input", () => {
    onChanged(input.valueAsNumber);
    display.innerText = input.valueAsNumber.toString();
  });

  controls.appendChild(span);
  controls.appendChild(input);
  controls.appendChild(display);
};
