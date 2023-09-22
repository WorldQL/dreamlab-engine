import { Sprite, Texture, TilingSprite } from 'pixi.js'

export interface SpriteSourceOptions {
  url: string
  texture?: Texture
  tile?: boolean | number
}

export type SpriteSource = SpriteSourceOptions | Texture | string

export interface SpriteOptions {
  width?: number
  height?: number

  zIndex?: number
}

interface TextureMap {
  [key: string]: Texture
}

export class TextureManager {
  private static sprites: TextureMap = {}

  public static async loadTexture(url: string) {
    let _t = this.sprites[url]

    if (_t !== undefined) {
      return
    }

    _t = await Texture.fromURL(url)
    this.sprites[url] = _t
    return _t
  }

  public static getTexture(url: string): Texture | undefined {
    return this.sprites[url]
  }
}

export const createSprite = (
  source: SpriteSource,
  { width, height, zIndex }: SpriteOptions = {},
): Sprite => {
  let texture: Texture

  if (typeof source === 'string') {
    texture = Texture.from(source)
  } else if (source && 'baseTexture' in source) {
    texture = source
  } else {
    throw new TypeError('Invalid sprite source provided.')
  }

  const isTiling = typeof source !== 'string' && 'tile' in source && source.tile

  const createSprite = () => {
    if (!isTiling) {
      return new Sprite(texture)
    }

    const sprite = new TilingSprite(texture)
    if (source && typeof source.tile === 'number') {
      sprite.tileScale.set(source.tile)
    }

    return sprite
  }

  const sprite = createSprite()
  sprite.anchor.set(0.5)

  if (width) sprite.width = width
  if (height) sprite.height = height
  if (zIndex) sprite.zIndex = zIndex

  return sprite
}

export const changeSpriteTexture = (
  sprite: Sprite | TilingSprite,
  source: SpriteSource,
): void => {
  if (typeof source === 'string') {
    const newTexture = TextureManager.getTexture(source)
    if (newTexture !== undefined) {
      sprite.texture = newTexture
    }
  } else if (source && 'baseTexture' in source) {
    sprite.texture = source
  } else if ('url' in source) {
    const newTexture = TextureManager.getTexture(source.url)
    if (newTexture !== undefined) {
      sprite.texture = newTexture
    }

    if (
      sprite instanceof TilingSprite &&
      source.tile &&
      typeof source.tile === 'number'
    ) {
      sprite.tileScale.set(source.tile)
    }
  } else {
    throw new TypeError(
      'Invalid sprite source provided for changeSpriteTexture.',
    )
  }
}
