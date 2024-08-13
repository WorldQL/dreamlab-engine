import * as PIXI from "@dreamlab/vendor/pixi.ts";

export type Label = { readonly container: PIXI.Container; readonly text: PIXI.Text };
export const createLabel = (icon: string, text?: string): Label => {
  const container = new PIXI.Container();

  const style = {
    fontFamily: "Iosevka",
    fontSize: 120,
    fill: "white",
    align: "left",
  } satisfies Partial<PIXI.TextStyle>;

  const _icon = new PIXI.Text({ text: icon, style });
  const _text = new PIXI.Text({ style, text });

  container.addChild(_icon);
  container.addChild(_text);
  _icon.scale.set(0.002);
  _text.scale.set(0.002);

  _icon.position.y = -0.03;
  _text.position.x = 0.35;

  return Object.freeze({ container, text: _text } satisfies Label);
};
