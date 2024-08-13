type FontStyle = "normal" | "italic" | "oblique";
type FontWeight = `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}00` | "bold" | "semibold";

export async function preloadFonts({
  families = [],
  styles = [],
  weights = [],
}: {
  families?: string[];
  styles?: FontStyle[];
  weights?: FontWeight[];
}) {
  const fonts: FontFace[] = [];
  await document.fonts.ready;
  document.fonts.forEach(font => fonts.push(font));

  const jobs: Promise<FontFace>[] = [];
  for (const font of fonts) {
    if (families.length > 0 && !families.includes(font.family)) continue;
    if (!styles.includes(font.style as FontStyle)) continue;
    if (!weights.includes(font.weight as FontWeight)) continue;
    if (font.status === "loaded") continue;

    jobs.push(font.load());
  }

  await Promise.all(jobs);
}
