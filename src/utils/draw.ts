import type { ColorSource } from 'pixi.js'
import { Graphics } from 'pixi.js'
import type { Vector } from '~/math/vector.js'

export interface DrawOptions {
  fill?: ColorSource
  fillAlpha?: number

  stroke?: ColorSource
  strokeWidth?: number
  strokeAlpha?: number
  strokeAlign?: number
}

// #region Box
export interface DrawBoxArgs {
  width: number
  height: number
}

type RedrawBox = (args: DrawBoxArgs, options?: DrawOptions) => void
export type BoxGraphics = Graphics & { readonly redraw: RedrawBox }
export const drawBox = (
  { width, height }: DrawBoxArgs,
  options: DrawOptions = {},
  graphics = new Graphics(),
): BoxGraphics => {
  const {
    fill = '#000',
    fillAlpha = 0,
    stroke = '#f00',
    strokeWidth = 8,
    strokeAlpha = 1,
    strokeAlign = 0,
  } = options

  graphics.clear()

  graphics.beginFill(fill, fillAlpha)
  graphics.lineStyle({
    color: stroke,
    width: strokeWidth,
    alignment: strokeAlign,
    alpha: strokeAlpha,
  })

  graphics.drawRect(0 - width / 2, 0 - height / 2, width, height)

  const redraw: RedrawBox = (args, newOptions) => {
    drawBox(args, newOptions ? newOptions : options, graphics)
  }

  return Object.assign(graphics, { redraw })
}
// #endregion

// #region Circle
export interface DrawCircleArgs {
  radius: number
}

type RedrawCircle = (args: DrawCircleArgs, options?: DrawOptions) => void
export type CircleGraphics = Graphics & { readonly redraw: RedrawCircle }
export const drawCircle = (
  { radius }: DrawCircleArgs,
  options: DrawOptions = {},
  graphics = new Graphics(),
): CircleGraphics => {
  const {
    fill = '#000',
    fillAlpha = 0,
    stroke = '#f00',
    strokeWidth = 8,
    strokeAlpha = 1,
    strokeAlign = 0,
  } = options

  graphics.clear()

  graphics.beginFill(fill, fillAlpha)
  graphics.lineStyle({
    color: stroke,
    width: strokeWidth,
    alignment: strokeAlign,
    alpha: strokeAlpha,
  })

  graphics.drawCircle(0, 0, radius)

  const redraw: RedrawCircle = (args, newOptions) => {
    drawCircle(args, newOptions ? newOptions : options, graphics)
  }

  return Object.assign(graphics, { redraw })
}
// #endregion

// #region Polygon
export const drawPolygon = (
  graphics: Graphics,
  points: Vector[],
  {
    fill = '#000',
    fillAlpha = 0,
    stroke = '#f00',
    strokeWidth = 8,
    strokeAlpha = 1,
    strokeAlign = 0,
  }: DrawOptions = {},
) => {
  graphics.clear()

  graphics.beginFill(fill, fillAlpha)
  graphics.lineStyle({
    color: stroke,
    width: strokeWidth,
    alignment: strokeAlign,
    alpha: strokeAlpha,
  })

  graphics.drawPolygon(points)
}

export const drawComplexPolygon = (
  graphics: Graphics,
  polygon: Vector[][],
  {
    fill = '#000',
    fillAlpha = 0,
    stroke = '#f00',
    strokeWidth = 8,
    strokeAlpha = 1,
    strokeAlign = 0,
  }: DrawOptions = {},
) => {
  graphics.clear()

  graphics.beginFill(fill, fillAlpha)
  graphics.lineStyle({
    color: stroke,
    width: strokeWidth,
    alignment: strokeAlign,
    alpha: strokeAlpha,
  })

  for (const points of polygon) {
    graphics.drawPolygon(points)
  }
}
// #endregion
