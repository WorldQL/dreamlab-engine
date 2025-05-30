export type AspectRatio = readonly [width: number, height: number] | "unlocked";
export const ASPECT_RATIOS = [
  "unlocked",
  [16, 9],
  [16, 10],
  [4, 3],
  [1, 1],
] as const satisfies AspectRatio[];

export const setAspectRatio = (ratio: AspectRatio, force = false): void => {
  const viewport = document.querySelector<HTMLDivElement>("div#viewport")!;
  const gamesDiv = viewport.querySelector<HTMLDivElement>("div#games")!;
  const gameviewDiv = document.querySelector<HTMLDivElement>("div#gameview")!;

  if (gameviewDiv.dataset.aspectDisabled === "" && !force) return;

  if (ratio === "unlocked") {
    gamesDiv.style.removeProperty("--aspect-ratio");
  } else {
    const [w, h] = ratio;
    gamesDiv.style.setProperty("--aspect-ratio", `${w} / ${h}`);
  }

  updateAspectRatio(true);
};

export const getAspectRatio = (): AspectRatio => {
  const viewport = document.querySelector<HTMLDivElement>("div#viewport")!;
  const gamesDiv = viewport.querySelector<HTMLDivElement>("div#games")!;

  const aspect = gamesDiv.style.getPropertyValue("--aspect-ratio");
  if (!aspect) return "unlocked";

  const [wStr, hStr] = aspect.split(" / ");
  const w = Number.parseFloat(wStr);
  const h = Number.parseFloat(hStr);

  return [w, h] as const;
};

export const updateAspectRatio = (resize = false): void => {
  const viewport = document.querySelector<HTMLDivElement>("div#viewport")!;
  const gamesDiv = viewport.querySelector<HTMLDivElement>("div#games")!;

  const aspect = gamesDiv.style.getPropertyValue("--aspect-ratio");
  if (aspect) {
    const [w, h] = aspect.split(" / ");
    const ratio = Number.parseFloat(w) / Number.parseFloat(h);

    const { clientWidth: width, clientHeight: height } = viewport;
    const currentRatio = width / height;

    gamesDiv.dataset.aspect = ratio > currentRatio ? "v" : "h";
  } else {
    delete gamesDiv.dataset.aspect;
  }

  if (resize) {
    // @ts-expect-error: global
    const games: { edit: ClientGame; play?: ClientGame } = globalThis.games;
    games.edit.renderer?.resize?.(true);
    games.play?.renderer?.resize?.(true);
  }
};
