import { Sprite, Texture, TilingSprite } from 'pixi.js'

export interface SpriteSourceOptions {
  url: string
  tile?: boolean | number
}

export type SpriteSource = SpriteSourceOptions | string

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
  const { url, tile = false }: SpriteSourceOptions =
    typeof source === 'string' ? { url: source } : source

  const texture = Texture.from(url)
  const createSprite = () => {
    if (!tile) return new Sprite(texture)

    const sprite = new TilingSprite(texture)
    if (typeof tile === 'number') sprite.tileScale.set(tile)

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
  console.log('running changeSpriteTexture')
  const { url }: SpriteSourceOptions =
    typeof source === 'string' ? { url: source } : source

  const newTexture = TextureManager.getTexture(url)

  if (newTexture !== undefined) {
    sprite.texture = newTexture
  }

  if (
    sprite instanceof TilingSprite &&
    typeof source !== 'string' &&
    source.tile &&
    typeof source.tile === 'number'
  ) {
    sprite.tileScale.set(source.tile)
  }
}
