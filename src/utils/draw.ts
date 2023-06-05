import type { Vector } from 'matter-js'
import type { ColorSource, Graphics } from 'pixi.js'

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

  graphics.drawRect(0 - width / 2, 0 - height / 2, width, height)
}
// #endregion

// #region Circle
export interface DrawCircleArgs {
  radius: number
}

export const drawCircle = (
  graphics: Graphics,
  { radius }: DrawCircleArgs,
  {
    fill = '#000',
    fillAlpha = 0,
    stroke = '#00f',
    strokeWidth = 2,
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

  graphics.drawCircle(0, 0, radius)
}
// #endregion

// #region Polygon
export const drawPolygon = (
  graphics: Graphics,
  points: Vector[],
  {
    fill = '#000',
    fillAlpha = 0,
    stroke = '#00f',
    strokeWidth = 2,
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
// #endregion
