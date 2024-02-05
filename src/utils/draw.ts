import type { ColorSource, Graphics } from 'pixi.js'
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

export const drawBox = (
  graphics: Graphics,
  { width, height }: DrawBoxArgs,
  options: DrawOptions = {},
): ((args: DrawBoxArgs) => void) => {
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

  return args => drawBox(graphics, args, options)
}
// #endregion

// #region Circle
export interface DrawCircleArgs {
  radius: number
}

export const drawCircle = (
  graphics: Graphics,
  { radius }: DrawCircleArgs,
  options: DrawOptions = {},
): ((args: DrawCircleArgs) => void) => {
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

  return args => drawCircle(graphics, args, options)
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
