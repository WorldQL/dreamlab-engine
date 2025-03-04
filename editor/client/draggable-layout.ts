const layout = document.querySelector("#layout")! as HTMLElement;
const leftSidebar = document.querySelector("#left-sidebar")! as HTMLElement;
const rightSidebar = document.querySelector("#right-sidebar")! as HTMLElement;

const dragL = layout.querySelector("#left-sidebar-drag")! as HTMLElement;
const dragR = layout.querySelector("#right-sidebar-drag")! as HTMLElement;
const dragB = layout.querySelector("#bottom-bar-drag")! as HTMLElement;
const dragLC = layout.querySelector("#left-center-drag")! as HTMLElement;
const dragRC = layout.querySelector("#right-center-drag")! as HTMLElement;

let leftDragging = false;
let rightDragging = false;
let bottomDragging = false;
let leftCenterDragging = false;
let rightCenterDragging = false;
let animationFrame: number | null = null;

const minHeightPx = 3 * parseFloat(getComputedStyle(document.documentElement).fontSize);
const minWidthPx = 8 * parseFloat(getComputedStyle(document.documentElement).fontSize);

document.addEventListener("pointerup", e => {
  leftDragging = false;
  rightDragging = false;
  bottomDragging = false;
  leftCenterDragging = false;
  rightCenterDragging = false;
  document.body.classList.remove("col-resize", "row-resize");

  // Release pointer capture
  if (e.pointerId !== undefined) {
    try {
      dragL.releasePointerCapture(e.pointerId);
      dragR.releasePointerCapture(e.pointerId);
      dragB.releasePointerCapture(e.pointerId);
      dragLC.releasePointerCapture(e.pointerId);
      dragRC.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore errors if the element didn't have capture
    }
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
});

document.addEventListener("pointermove", e => {
  if (
    !leftDragging &&
    !rightDragging &&
    !bottomDragging &&
    !leftCenterDragging &&
    !rightCenterDragging
  ) {
    return;
  }

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

    if (leftCenterDragging) {
      const leftSidebarRect = leftSidebar.getBoundingClientRect();
      document.body.classList.add("row-resize");

      let heightPx = e.clientY - leftSidebarRect.top - dragLC.getBoundingClientRect().height;

      if (heightPx < minHeightPx) heightPx = minHeightPx;

      const heightPercentage = (heightPx / leftSidebarRect.height) * 100;
      layout.style.setProperty("--left-center-height", `${heightPercentage.toFixed(2)}%`);
    }

    if (rightCenterDragging) {
      const rightSidebarRect = rightSidebar.getBoundingClientRect();
      document.body.classList.add("row-resize");

      let heightPx = e.clientY - rightSidebarRect.top - dragLC.getBoundingClientRect().height;

      if (heightPx < minHeightPx) heightPx = minHeightPx;

      const heightPercentage = (heightPx / rightSidebarRect.height) * 100;
      layout.style.setProperty("--right-center-height", `${heightPercentage.toFixed(2)}%`);
    }
  });
});

dragL.addEventListener("pointerdown", e => {
  e.preventDefault();
  leftDragging = true;
  dragL.setPointerCapture(e.pointerId);
});

dragR.addEventListener("pointerdown", e => {
  e.preventDefault();
  rightDragging = true;
  dragR.setPointerCapture(e.pointerId);
});

dragB.addEventListener("pointerdown", e => {
  e.preventDefault();
  bottomDragging = true;
  dragB.setPointerCapture(e.pointerId);
});

dragLC.addEventListener("pointerdown", e => {
  e.preventDefault();
  leftCenterDragging = true;
  dragLC.setPointerCapture(e.pointerId);
});

dragRC.addEventListener("pointerdown", e => {
  e.preventDefault();
  rightCenterDragging = true;
  dragRC.setPointerCapture(e.pointerId);
});
