const layout = document.querySelector("#layout")! as HTMLElement;
const dragL = layout.querySelector("#left-sidebar-drag")! as HTMLElement;
const dragR = layout.querySelector("#right-sidebar-drag")! as HTMLElement;
const dragB = layout.querySelector("#bottom-bar-drag")! as HTMLElement;

let leftDragging = false;
let rightDragging = false;
let bottomDragging = false;
let animationFrame: number | null = null;

document.addEventListener("pointerup", () => {
  leftDragging = false;
  rightDragging = false;
  bottomDragging = false;
  document.body.classList.remove("col-resize", "row-resize");
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
});

document.addEventListener("pointermove", e => {
  if (!leftDragging && !rightDragging && !bottomDragging) return;

  const layoutRect = layout.getBoundingClientRect();

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  animationFrame = requestAnimationFrame(() => {
    if (leftDragging) {
      document.body.classList.add("col-resize");
      const width =
        (e.clientX - layoutRect.left - dragL.getBoundingClientRect().width) / layoutRect.width;
      layout.style.setProperty("--left-sidebar-width", `${(width * 100).toFixed(2)}%`);
    }
    if (rightDragging) {
      document.body.classList.add("col-resize");
      const width =
        (layoutRect.right - e.clientX - dragR.getBoundingClientRect().width) / layoutRect.width;
      layout.style.setProperty("--right-sidebar-width", `${(width * 100).toFixed(2)}%`);
    }
    if (bottomDragging) {
      document.body.classList.add("row-resize");
      const height =
        (layoutRect.bottom - e.clientY - dragB.getBoundingClientRect().height) /
        layoutRect.height;
      layout.style.setProperty("--bottom-bar-height", `${(height * 100).toFixed(2)}%`);
    }
  });
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
