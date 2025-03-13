export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const _SVG_TAG_NAMES = ["svg", "path", "g"] as const;
export const SVG_TAG_NAMES = _SVG_TAG_NAMES as readonly string[];

type HTMLMap = HTMLElementTagNameMap;
type SVGMap = Pick<SVGElementTagNameMap, (typeof _SVG_TAG_NAMES)[number]>;
export type TagNames = keyof HTMLMap | keyof SVGMap;
export type TagType<TagName extends TagNames> = TagName extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[TagName]
  : TagName extends keyof SVGElementTagNameMap
    ? SVGElementTagNameMap[TagName]
    : never;
