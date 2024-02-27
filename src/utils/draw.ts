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

export type BoxGraphics = Graphics & {
  redraw(args: DrawBoxArgs, options?: DrawOptions): void
}

export const drawBox = (
  drawBoxArgs: DrawBoxArgs,
  initialOptions: DrawOptions = {},
  graphics = new Graphics(),
): BoxGraphics => {
  const draw = (args: DrawBoxArgs, options: DrawOptions) => {
    const { width, height } = args
    const {
      fill = '#000',
      fillAlpha = 1,
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
  }

  draw(drawBoxArgs, initialOptions)

  const redraw: (args: DrawBoxArgs, options?: DrawOptions) => void = (
    args,
    options = {},
  ) => {
    Object.assign(initialOptions, options)
    draw(args, initialOptions)
  }

  return Object.assign(graphics, { redraw })
}
// #endregion

// #region Circle
export interface DrawCircleArgs {
  radius: number
}

export type CircleGraphics = Graphics & {
  redraw(args: DrawCircleArgs, options?: DrawOptions): void
}

export const drawCircle = (
  drawCircleArgs: DrawCircleArgs,
  initialOptions: DrawOptions = {},
  graphics = new Graphics(),
): CircleGraphics => {
  const draw = (args: DrawCircleArgs, options: DrawOptions) => {
    const { radius } = args
    const {
      fill = '#000',
      fillAlpha = 1,
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
  }

  draw(drawCircleArgs, initialOptions)

  const redraw: (args: DrawCircleArgs, options?: DrawOptions) => void = (
    args,
    options = {},
  ) => {
    Object.assign(initialOptions, options)
    draw(args, initialOptions)
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
