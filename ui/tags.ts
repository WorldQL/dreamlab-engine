export type TagNames = keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap;
export type TagType<TagName extends TagNames> = TagName extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[TagName]
  : TagName extends keyof SVGElementTagNameMap
    ? SVGElementTagNameMap[TagName]
    : never;
