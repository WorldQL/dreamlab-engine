/* eslint-disable @typescript-eslint/no-explicit-any */
interface User {
  email: string
  name: string
  displayName: string
  playerData: any
}

interface InputConfig {
  primary: string
  secondary?: string
}

interface Inputs {
  [key: string]: InputConfig
}

interface InputWrapper {
  inputs: Inputs
  inputsRef: {
    current: Inputs
  }
}

interface HandlePoint {
  id: string
  x: number
  y: number
  objectId: string | null
}

interface ImageTask {
  id: string
  imageURL: string
}

interface ObjectItem {
  id: string
  displayName: string
  imageTasks: ImageTask[]
  handlePoint: HandlePoint
}

export interface PlayerData {
  user: User
  inputs: InputWrapper
  objects: ObjectItem[]
}

export class PlayerDataManager {
  private static playerData: PlayerData = {
    user: {
      email: '',
      name: '',
      displayName: '',
      playerData: {},
    },
    inputs: {
      inputs: {},
      inputsRef: {
        current: {},
      },
    },
    objects: [],
  }

  private static defaultObject: ObjectItem = {
    id: 'default',
    displayName: 'Default Weapon',
    imageTasks: [
      {
        id: 'default-image',
        imageURL:
          'https://dreamlab-user-assets.s3.us-east-1.amazonaws.com/path-in-s3/1693261056400.png',
      },
    ],
    handlePoint: {
      id: 'default-handle',
      x: 0,
      y: 0,
      objectId: null,
    },
  }

  public static get user(): User {
    return this.playerData.user
  }

  public static get inputs(): InputWrapper {
    return this.playerData.inputs
  }

  public static get objects(): ObjectItem[] {
    return this.playerData.objects
  }

  public static setAll(data: PlayerData | string): void {
    let parsedData: PlayerData
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data)
      } catch (error) {
        console.error('Failed to parse and set data:', error)
        return
      }
    } else if (typeof data === 'object' && data !== null) {
      parsedData = data
    } else {
      console.error('Invalid data format.')
      return
    }

    this.playerData = parsedData
  }

  public static set<T = unknown>(key: keyof PlayerData, jsonStr: string): void {
    try {
      const value: T = JSON.parse(jsonStr)
      this.playerData[key] = value as any
    } catch (error) {
      console.error(`Failed to set value for ${key}:`, error)
    }
  }

  public static get<T = unknown>(key: keyof PlayerData): T {
    return this.playerData[key] as T
  }

  public static deepGet<T = unknown>(path: string): T | undefined {
    const keys = path.split('.')
    let current: any = this.playerData

    for (const key of keys) {
      if (current[key] !== undefined) {
        current = current[key]
      } else {
        return undefined
      }
    }

    return current as T
  }

  public static getAll(): PlayerData {
    return this.playerData
  }

  private static currentObjectIndex = 0

  public static nextWeapon(): ObjectItem {
    if (this.playerData.objects.length === 0) {
      console.warn('No objects in the inventory. Returning default weapon.')
      return this.defaultObject
    }

    this.currentObjectIndex =
      (this.currentObjectIndex + 1) % this.playerData.objects.length
    return (
      this.playerData.objects[this.currentObjectIndex] ?? this.defaultObject
    )
  }

  public static getCurrentWeapon(): ObjectItem {
    if (this.playerData.objects.length === 0) {
      console.warn('No objects in the inventory. Returning default weapon.')
      return this.defaultObject
    }

    return (
      this.playerData.objects[this.currentObjectIndex] ?? this.defaultObject
    )
  }

  public static setCurrentWeaponIndex(index: number): void {
    if (index < 0 || index >= this.playerData.objects.length) {
      console.error('Invalid object index.')
      return
    }

    this.currentObjectIndex = index
  }
}
