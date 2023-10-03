import type { Texture } from 'pixi.js'
import type { ObjectItem } from './playerDataManager'
import { createSprite } from '~/textures/sprites.js'
import { generateCUID, IDType } from '~/utils/cuid.js'

export interface ItemOptions {
  anchorX?: number | undefined
  anchorY?: number | undefined
  hand?: string // right or left
}

export interface PlayerInventoryItem {
  id: string
  displayName: string
  texture: Texture
  textureURL: string
  animationName: string
  itemOptions?: ItemOptions
}
export const createNewItem = (
  displayName: string,
  textureURL: string,
  animationName: string,
  itemOptions?: ItemOptions,
): PlayerInventoryItem => {
  const texture = createSprite(textureURL).texture
  const id = generateCUID(IDType.Object)

  const newItem: PlayerInventoryItem = {
    id,
    displayName,
    texture,
    textureURL,
    animationName,
  }

  if (itemOptions) {
    newItem.itemOptions = itemOptions
  }

  return newItem
}

export class PlayerInventory {
  private currentObjectIndex: number
  private items: PlayerInventoryItem[]

  public constructor() {
    this.currentObjectIndex = 0
    this.items = []
  }

  public setObjects(objects: ObjectItem[]): void {
    this.items = objects.map(obj => {
      const imageUrl =
        obj.imageTasks && obj.imageTasks.length > 0
          ? obj.imageTasks[0]!.imageURL
          : ''

      const itemTexture = createSprite(imageUrl).texture

      const itemOptions: ItemOptions = {}
      if (obj.handlePoint) {
        itemOptions.anchorX = obj.handlePoint.x
        itemOptions.anchorY = obj.handlePoint.y
      }
      // if(obj.hand) {
      //   itemOptions.hand = obj.hand;
      // }

      return {
        id: obj.id,
        displayName: obj.displayName,
        texture: itemTexture,
        textureURL: imageUrl,
        animationName: obj.animationName,
        itemOptions,
      }
    })
  }

  public nextItem(): PlayerInventoryItem {
    this.currentObjectIndex = (this.currentObjectIndex + 1) % this.items.length
    return this.items[this.currentObjectIndex] ?? this.dummyItem()
  }

  public currentItem(): PlayerInventoryItem {
    return this.items[this.currentObjectIndex] ?? this.dummyItem()
  }

  public getItems(): PlayerInventoryItem[] {
    return this.items
  }

  public addItem(item: PlayerInventoryItem): void {
    this.items.push(item)
  }

  public removeItem(targetItem: PlayerInventoryItem): void {
    const index = this.items.findIndex(item => item.id === targetItem.id)
    if (index !== -1) {
      this.items.splice(index, 1)
    }
  }

  public setCurrentItem(targetItem: PlayerInventoryItem): void {
    const index = this.items.findIndex(item => item.id === targetItem.id)
    if (index < 0 || index >= this.items.length) {
      console.error('Invalid item index.')
      return
    }

    this.currentObjectIndex = index
  }

  public setItemIndex(index: number): void {
    if (index < 0 || index >= this.items.length) {
      console.error('Invalid item index.')
      return
    }

    this.currentObjectIndex = index
  }

  public clear(): void {
    this.items = []
    this.currentObjectIndex = 0
  }

  public dummyItem(): PlayerInventoryItem {
    return {
      id: 'default',
      displayName: 'Default Item',
      texture: createSprite(
        'https://dreamlab-user-assets.s3.us-east-1.amazonaws.com/path-in-s3/1693261056400.png',
      ).texture,
      textureURL:
        'https://dreamlab-user-assets.s3.us-east-1.amazonaws.com/path-in-s3/1693261056400.png',
      animationName: 'greatsword',
      itemOptions: {
        anchorX: undefined,
        anchorY: undefined,
        hand: 'right',
      },
    }
  }
}
