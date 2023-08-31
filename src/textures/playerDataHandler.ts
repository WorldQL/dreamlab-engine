// Define interfaces
interface User {
  email: string
  image: string
  name: string
  displayName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  workerId: string | null
  created: string
  prompt: string
  negativePrompt: string
  type: string
  status: string
  imageURL: string
  creatorId: string
  objectId: string
  seed: number
}

interface ObjectItem {
  id: string
  displayName: string
  created: string
  handlePointId: string
  creatorId: string
  imageTasks: ImageTask[]
  handlePoint: HandlePoint
}

export interface PlayerData {
  user: User
  inputs: InputWrapper
  objects: ObjectItem[]
}

export const createPlayerData = (): PlayerData => {
  return {
    user: {
      email: 'devcodedred@gmail.com',
      image:
        'https://lh3.googleusercontent.com/a/AAcHTtccVeIfCbiuWnBkgTQxJzbSwGsCQJg_JrQlr7u_HeiGeA=s96-c',
      name: 'CodedRed',
      displayName: 'CodedRed',
      playerData: null,
    },
    inputs: {
      inputs: {
        left: { primary: 'KeyA', secondary: 'ArrowLeft' },
        right: { primary: 'KeyD', secondary: 'ArrowRight' },
        jump: { primary: 'Space', secondary: 'KeyW' },
        down: { primary: 'KeyS', secondary: 'ArrowDown' },
        'toggle-noclip': { primary: 'KeyV' },
        'toggle-debug': { primary: 'KeyP' },
        'left-click': { primary: 'MouseLeft' },
      },
      inputsRef: {
        current: {
          left: { primary: 'KeyA', secondary: 'ArrowLeft' },
          right: { primary: 'KeyD', secondary: 'ArrowRight' },
          jump: { primary: 'Space', secondary: 'KeyW' },
          down: { primary: 'KeyS', secondary: 'ArrowDown' },
          'toggle-noclip': { primary: 'KeyV' },
          'toggle-debug': { primary: 'KeyP' },
          'left-click': { primary: 'MouseLeft' },
        },
      },
    },
    objects: [
      {
        id: 'o_hf48xs7t082yq81qji9uk7tt',
        displayName: 'longsword',
        created: '2023-08-29T20:01:57.540Z',
        handlePointId: 'h_g65mrvc25mywe5dih74haoei',
        creatorId: 'u_ral1nug9te322syevkfn1zxg',
        imageTasks: [
          {
            id: 'i_cny16k4himel8v95qph2fztg',
            workerId: null,
            created: '2023-08-29T20:01:57.537Z',
            prompt: 'Image is from file explorer',
            negativePrompt: 'This is not a Dreamlab generated image',
            type: 'OBJECT',
            status: 'COMPLETED',
            imageURL:
              'https://dreamlab-user-assets.s3.us-east-1.amazonaws.com/path-in-s3/1693339947404.png',
            creatorId: 'u_ral1nug9te322syevkfn1zxg',
            objectId: 'o_hf48xs7t082yq81qji9uk7tt',
            seed: 0,
          },
        ],
        handlePoint: {
          id: 'h_g65mrvc25mywe5dih74haoei',
          x: 57,
          y: 207,
          objectId: null,
        },
      },
      {
        id: 'o_rt3gc2ef4b9yy6hncqp2dhi6',
        displayName: 'katana',
        created: '2023-08-28T17:48:45.141Z',
        handlePointId: 'h_q9pqnpd3pjii4ah8j0nrbf64',
        creatorId: 'u_ral1nug9te322syevkfn1zxg',
        imageTasks: [
          {
            id: 'i_w0bnxl2l4u3gksidsta4v9v2',
            workerId: null,
            created: '2023-08-28T17:48:45.139Z',
            prompt: 'Image is from file explorer',
            negativePrompt: 'This is not a Dreamlab generated image',
            type: 'OBJECT',
            status: 'COMPLETED',
            imageURL:
              'https://dreamlab-user-assets.s3.us-east-1.amazonaws.com/path-in-s3/1693261056400.png',
            creatorId: 'u_ral1nug9te322syevkfn1zxg',
            objectId: 'o_rt3gc2ef4b9yy6hncqp2dhi6',
            seed: 0,
          },
        ],
        handlePoint: {
          id: 'h_q9pqnpd3pjii4ah8j0nrbf64',
          x: 42,
          y: 264,
          objectId: null,
        },
      },
      {
        id: 'awdnakjwdnawd',
        displayName: 'Gold Sword',
        created: '2023-08-09T17:09:11.293Z',
        handlePointId: 'h_r76o3wh4nfdgxib6bxisrp9l',
        creatorId: 'u_ral1nug9te322syevkfn1zxg',
        imageTasks: [
          {
            id: 'awdawdawdawda',
            workerId: 'dev',
            created: '2023-08-09T17:10:01.446Z',
            prompt: 'gold sword',
            negativePrompt: '',
            type: 'OBJECT',
            status: 'COMPLETED',
            imageURL:
              'https://dreamlab-user-assets.s3.us-east-1.amazonaws.com/path-in-s3/1693240114500.png',
            creatorId: 'u_ral1nug9te322syevkfn1zxg',
            objectId: 'awdnakjwdnawd',
            seed: 0,
          },
        ],
        handlePoint: {
          id: 'h_r76o3wh4nfdgxib6bxisrp9l',
          x: 54,
          y: 245,
          objectId: null,
        },
      },
    ],
  }
}

export const getUserData = (playerData: PlayerData): User => {
  return playerData.user
}

export const getInputConfigs = (playerData: PlayerData): InputWrapper => {
  return playerData.inputs
}

export const getObjects = (playerData: PlayerData): ObjectItem[] => {
  return playerData.objects
}
