import type { ObjectItem } from './playerDataManager'

interface Weapon {
  id: string
  displayName: string
  imageURL: string
  handlePointX: number
  handlePointY: number
  animationName: string
}

export class PlayerInventory {
  private static defaultObject: Weapon = {
    id: 'default',
    displayName: 'Default Weapon',
    imageURL:
      'https://dreamlab-user-assets.s3.us-east-1.amazonaws.com/path-in-s3/1693261056400.png',
    handlePointX: 0,
    handlePointY: 0,
    animationName: 'greatsword',
  }

  private static currentObjectIndex = 0
  private static weapons: Weapon[] = []

  public static setObjects(objects: ObjectItem[]): void {
    this.weapons = objects.map(obj => {
      const imageURL =
        obj.imageTasks && obj.imageTasks.length > 0
          ? obj.imageTasks[0]!.imageURL
          : ''
      const handlePointX = obj.handlePoint ? obj.handlePoint.x : 0
      const handlePointY = obj.handlePoint ? obj.handlePoint.y : 0

      return {
        id: obj.id,
        displayName: obj.displayName,
        imageURL,
        handlePointX,
        handlePointY,
        animationName: obj.animationName,
      }
    })
  }

  public static nextWeapon(): Weapon {
    this.currentObjectIndex =
      (this.currentObjectIndex + 1) % this.weapons.length
    return (
      this.weapons[this.currentObjectIndex] ?? PlayerInventory.defaultObject
    )
  }

  public static currentWeapon(): Weapon {
    return (
      this.weapons[this.currentObjectIndex] ?? PlayerInventory.defaultObject
    )
  }

  public static setCurrentWeaponIndex(index: number): void {
    if (index < 0 || index >= this.weapons.length) {
      console.error('Invalid weapon index.')
      return
    }

    this.currentObjectIndex = index
  }
}
