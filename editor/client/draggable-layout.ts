const layout = document.querySelector("#layout")! as HTMLElement;
const dragL = layout.querySelector("#left-sidebar-drag")! as HTMLElement;
const dragR = layout.querySelector("#right-sidebar-drag")! as HTMLElement;
const dragB = layout.querySelector("#bottom-bar-drag")! as HTMLElement;

let leftDragging = false;
let rightDragging = false;
let bottomDragging = false;
let animationFrame: number | null = null;

const minHeightPx = 3 * parseFloat(getComputedStyle(document.documentElement).fontSize);
const minWidthPx = 8 * parseFloat(getComputedStyle(document.documentElement).fontSize);

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
      let widthPx = e.clientX - layoutRect.left - dragL.getBoundingClientRect().width;

      if (widthPx < minWidthPx) widthPx = minWidthPx;

      const widthPercentage = (widthPx / layoutRect.width) * 100;
      layout.style.setProperty("--left-sidebar-width", `${widthPercentage.toFixed(2)}%`);
    }

    if (rightDragging) {
      document.body.classList.add("col-resize");
      let widthPx = layoutRect.right - e.clientX - dragR.getBoundingClientRect().width;

      if (widthPx < minWidthPx) widthPx = minWidthPx;

      const widthPercentage = (widthPx / layoutRect.width) * 100;
      layout.style.setProperty("--right-sidebar-width", `${widthPercentage.toFixed(2)}%`);
    }

    if (bottomDragging) {
      document.body.classList.add("row-resize");
      let heightPx = layoutRect.bottom - e.clientY - dragB.getBoundingClientRect().height;

      if (heightPx < minHeightPx) heightPx = minHeightPx;

      const heightPercentage = (heightPx / layoutRect.height) * 100;
      layout.style.setProperty("--bottom-bar-height", `${heightPercentage.toFixed(2)}%`);
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
