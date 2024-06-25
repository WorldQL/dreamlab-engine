const handleResize = (
  e: React.MouseEvent<HTMLDivElement>,
  setDimension: (dimension: number) => void,
  columnKey: "left" | "right",
  minDimension: number,
  maxDimension: number,
) => {
  e.preventDefault();
  const startCoord = e.clientX;
  const startDimension = e.currentTarget.parentElement?.clientWidth || 0;

  const target = e.currentTarget;
  target.classList.add("active");
  document.body.classList.add("resizing-horizontally");

  const handleMouseMove = (e: MouseEvent) => {
    const diffCoord = e.clientX - startCoord;
    const newDimension = startDimension + (columnKey === "left" ? diffCoord : -diffCoord);
    setDimension(Math.max(Math.min(newDimension, maxDimension), minDimension));
    e.preventDefault();
  };

  const handleMouseUp = () => {
    target.classList.remove("active");
    document.body.classList.remove("resizing-horizontally");
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

const handleVerticalResize = (
  e: React.MouseEvent<HTMLDivElement>,
  setDimension: (dimension: number) => void,
  elementRef: React.RefObject<HTMLDivElement>,
  minDimension: number,
  maxDimension: number,
  isConsole: boolean = false,
) => {
  e.preventDefault();
  const startCoord = e.clientY;
  const startDimension = elementRef.current?.clientHeight || 0;

  const target = e.currentTarget;
  target.classList.add("active");
  document.body.classList.add("resizing-vertically");

  const handleMouseMove = (e: MouseEvent) => {
    const diffCoord = isConsole ? startCoord - e.clientY : e.clientY - startCoord;
    let newDimension = isConsole
      ? startDimension + diffCoord
      : ((startDimension + diffCoord) / window.innerHeight) * 100;

    if (isConsole) {
      newDimension = Math.max(Math.min(newDimension, maxDimension), minDimension);
    } else {
      newDimension = Math.max(Math.min(newDimension, maxDimension), minDimension);
    }

    setDimension(newDimension);
    e.preventDefault();
  };

  const handleMouseUp = () => {
    target.classList.remove("active");
    document.body.classList.remove("resizing-vertically");
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

export { handleResize, handleVerticalResize };
