const layout = document.querySelector("#layout")! as HTMLElement;
const dragL = layout.querySelector("#left-sidebar-drag")! as HTMLElement;
const dragR = layout.querySelector("#right-sidebar-drag")! as HTMLElement;
const dragB = layout.querySelector("#bottom-bar-drag")! as HTMLElement;

let leftDragging = false;
let rightDragging = false;
let bottomDragging = false;

document.addEventListener("pointerup", () => {
  leftDragging = false;
  rightDragging = false;
  bottomDragging = false;
});

document.addEventListener("pointermove", e => {
  const layoutRect = layout.getBoundingClientRect();

  if (leftDragging) {
    const width =
      (e.clientX - layoutRect.left - dragL.getBoundingClientRect().width) / layoutRect.width;
    layout.style.setProperty("--left-sidebar-width", `${(width * 100).toFixed(2)}%`);
  }
  if (rightDragging) {
    const width =
      (layoutRect.right - e.clientX - dragR.getBoundingClientRect().width) / layoutRect.width;
    layout.style.setProperty("--right-sidebar-width", `${(width * 100).toFixed(2)}%`);
  }
  if (bottomDragging) {
    const height =
      (layoutRect.bottom - e.clientY - dragB.getBoundingClientRect().height) /
      layoutRect.height;
    layout.style.setProperty("--bottom-bar-height", `${(height * 100).toFixed(2)}%`);
  }
});

dragL.addEventListener("pointerdown", e => {
  e.preventDefault();
  leftDragging = true;
});

dragR.addEventListener("pointerdown", e => {
  e.preventDefault();
  rightDragging = true;
});

dragB.addEventListener("pointerdown", e => {
  e.preventDefault();
  bottomDragging = true;
});
