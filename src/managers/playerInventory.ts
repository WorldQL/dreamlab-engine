import { Texture } from 'pixi.js'
import type { KnownAnimation } from '~/entities/player.js'
import type { Game } from '~/game.js'
import type { ObjectItem } from '~/managers/playerDataManager.js'
import { createSprite } from '~/textures/sprites.js'
import { generateCUID, IDType } from '~/utils/cuid.js'

export interface ItemOptions {
  anchorX?: number | undefined
  anchorY?: number | undefined
  hand?: 'left' | 'right'
}

export interface PlayerInventoryItem {
  id: string
  displayName: string
  texture: Texture
  textureURL: string
  animationName: string
  itemOptions?: ItemOptions
}

export class PlayerInventory {
  private currentObjectIndex: number
  private items: PlayerInventoryItem[]

  public constructor(private readonly game: Game<false>) {
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

  public createNewItem = (
    displayName: string,
    textureURL: string,
    animationName: string,
    itemOptions?: ItemOptions,
  ): PlayerInventoryItem => {
    const texture = createSprite(textureURL).texture
    const id = generateCUID(IDType.Object)

    const validAnimations: KnownAnimation[] = [
      'idle',
      'jump',
      'walk',
      'bow',
      'greatsword',
    ]
    const finalAnimationName = validAnimations.includes(
      animationName as KnownAnimation,
    )
      ? animationName
      : 'greatsword'

    const newItem: PlayerInventoryItem = {
      id,
      displayName,
      texture,
      textureURL,
      animationName: finalAnimationName,
    }

    if (itemOptions) {
      newItem.itemOptions = itemOptions
    }

    return newItem
  }

  public getItems(): PlayerInventoryItem[] {
    return this.items
  }

  public addItem(item: PlayerInventoryItem): void {
    this.items.push(item)
    this.game.events.common.emit('onInventoryAddItem', item, this)
  }

  public removeItem(targetItem: PlayerInventoryItem): void {
    const index = this.items.findIndex(item => item.id === targetItem.id)
    if (index !== -1) {
      this.items.splice(index, 1)
      this.game.events.common.emit('onInventoryRemoveItem', targetItem, this)
    }
  }

  public getItemInHand(): PlayerInventoryItem {
    return this.items[this.currentObjectIndex] ?? this.defaultPunchAction()
  }

  public setItemInHand(targetItem: PlayerInventoryItem | undefined): void {
    if (targetItem) {
      const index = this.items.findIndex(item => item.id === targetItem.id)
      if (index < 0 || index >= this.items.length) {
        this.currentObjectIndex = -1
        return
      }

      this.currentObjectIndex = index
    } else {
      this.currentObjectIndex = -1
    }

    this.game.events.common.emit('onPlayerSwitchedItem', targetItem, this)
  }

  public setItemIndex(index: number): void {
    if (index < 0 || index >= this.items.length) {
      this.currentObjectIndex = -1
      return
    }

    this.currentObjectIndex = index
  }

  public clear(): void {
    this.items = []
    this.currentObjectIndex = 0
  }

  public defaultPunchAction(): PlayerInventoryItem {
    return {
      id: 'DefaultPunch',
      displayName: 'Punch',
      texture: Texture.EMPTY,
      textureURL: 'undefined',
      animationName: 'punch',
      itemOptions: {
        anchorX: undefined,
        anchorY: undefined,
        hand: 'right',
      },
    }
  }
}
