export const handleResize = (
  e: React.MouseEvent<HTMLDivElement>,
  setColumnWidth: (width: number) => void,
  columnKey: "left" | "right",
  leftColumnWidth: number,
  rightColumnWidth: number,
  gameContainer: React.RefObject<HTMLDivElement>,
) => {
  e.preventDefault();
  const startX = e.clientX;
  const startWidth = e.currentTarget.parentElement?.clientWidth || 0;

  const handleMouseMove = (e: MouseEvent) => {
    const diffX = e.clientX - startX;
    const newWidth = startWidth + (columnKey === "left" ? diffX : -diffX);
    const minWidth = 250;
    const maxWidth = 500;

    setColumnWidth(Math.max(Math.min(newWidth, maxWidth), minWidth));

    if (columnKey === "left") {
      const gameContainerWidth = window.innerWidth - (newWidth + rightColumnWidth);
      gameContainer.current!.style.width = `${gameContainerWidth}px`;
    } else {
      const gameContainerWidth = window.innerWidth - (leftColumnWidth + newWidth);
      gameContainer.current!.style.width = `${gameContainerWidth}px`;
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

export const handleVerticalResize = (
  e: React.MouseEvent<HTMLDivElement>,
  setTopSectionHeight: (height: number) => void,
  topSectionRef: React.RefObject<HTMLDivElement>,
) => {
  e.preventDefault();
  const startY = e.clientY;
  const startHeight = topSectionRef.current?.clientHeight || 0;

  const handleMouseMove = (e: MouseEvent) => {
    const diffY = e.clientY - startY;
    const newHeight = ((startHeight + diffY) / window.innerHeight) * 100;
    const minHeight = 10;
    const maxHeight = 90;

    setTopSectionHeight(Math.max(Math.min(newHeight, maxHeight), minHeight));
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

export const handleConsoleResize = (
  e: React.MouseEvent<HTMLDivElement>,
  setConsoleHeight: (height: number) => void,
  consoleRef: React.RefObject<HTMLDivElement>,
  topSectionRef: React.RefObject<HTMLDivElement>,
  gameContainer: React.RefObject<HTMLDivElement>,
) => {
  e.preventDefault();
  const startY = e.clientY;
  const startHeight = consoleRef.current?.clientHeight || 0;

  const handleMouseMove = (e: MouseEvent) => {
    const diffY = startY - e.clientY;
    const newHeight = startHeight + diffY;
    const minHeight = 150;
    const maxHeight = 400;

    if (newHeight >= minHeight && newHeight <= maxHeight) {
      setConsoleHeight(newHeight);

      const gameContainerHeight =
        window.innerHeight - (topSectionRef.current?.clientHeight || 0) - newHeight;
      gameContainer.current!.style.height = `${gameContainerHeight}px`;
    } else if (newHeight < minHeight) {
      setConsoleHeight(minHeight);

      const gameContainerHeight =
        window.innerHeight - (topSectionRef.current?.clientHeight || 0) - minHeight;
      gameContainer.current!.style.height = `${gameContainerHeight}px`;
    } else if (newHeight > maxHeight) {
      setConsoleHeight(maxHeight);

      const gameContainerHeight =
        window.innerHeight - (topSectionRef.current?.clientHeight || 0) - maxHeight;
      gameContainer.current!.style.height = `${gameContainerHeight}px`;
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};
