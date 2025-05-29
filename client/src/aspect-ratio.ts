export type AspectRatio = readonly [width: number, height: number];

export const setAspectRatio = (locked: boolean, ratio: AspectRatio): void => {
  const viewport = document.querySelector<HTMLDivElement>("div#viewport")!;
  const gameDiv = viewport.querySelector<HTMLDivElement>("div#game")!;

  if (!locked) {
    gameDiv.style.removeProperty("--aspect-ratio");
  } else {
    const [w, h] = ratio;
    gameDiv.style.setProperty("--aspect-ratio", `${w} / ${h}`);
  }

  updateAspectRatio(true);
};

export const updateAspectRatio = (resize = false): void => {
  const viewport = document.querySelector<HTMLDivElement>("div#viewport")!;
  const gameDiv = viewport.querySelector<HTMLDivElement>("div#game")!;

  const aspect = gameDiv.style.getPropertyValue("--aspect-ratio");
  if (aspect) {
    const [w, h] = aspect.split(" / ");
    const ratio = Number.parseFloat(w) / Number.parseFloat(h);

    const { clientWidth: width, clientHeight: height } = viewport;
    const currentRatio = width / height;

    gameDiv.dataset.aspect = ratio > currentRatio ? "v" : "h";
  } else {
    delete gameDiv.dataset.aspect;
  }

  if (resize) {
    // @ts-expect-error: global
    const game: ClientGame = globalThis.game;
    game?.renderer?.resize(true);
  }
};
