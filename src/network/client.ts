import type { CamelCase, Except } from 'type-fest'
import type { PlayerInput } from '~/entities/player.js'
import type { Gear } from '~/managers/gear.js'
import type { Transform } from '~/math/transform.js'
import type { Vector } from '~/math/vector.js'
import type { LooseSpawnableDefinition } from '~/spawnable/definition.js'
import type { Data, Listeners } from './shared.js'

type Inputs = `${PlayerInput}` extends `@player/${infer T}` ? T : never
type InputMap = Record<CamelCase<Inputs>, boolean>

export type MessageListenerClient = (channel: string, data: Data) => void

interface NetClientListeners {
  customMessage: [channel: string, listener: MessageListenerClient]
}

export type BareNetClient = Except<NetClient, 'type'>
export interface NetClient extends Listeners<NetClientListeners> {
  type: 'client'

  sendCustomMessage(channel: string, data: Data): Promise<void> | void
  sendPlayerPosition(
    position: Vector,
    velocity: Vector,
    flipped: boolean,
  ): Promise<void> | void
  sendPlayerMotionInputs(inputs: InputMap): Promise<void> | void
  sendPlayerCharacterId(characterId: string | undefined): Promise<void> | void
  sendPlayerAnimation(animation: string): Promise<void> | void
  sendPlayerGear(gear: Gear | undefined): Promise<void> | void

  sendEntityCreate(definition: LooseSpawnableDefinition): Promise<void> | void
  sendEntityDestroy(entityID: string): Promise<void> | void
  sendTransformUpdate(
    entityID: string,
    transform: Transform,
  ): Promise<void> | void
  sendArgsUpdate(
    entityID: string,
    path: string,
    value: unknown,
  ): Promise<void> | void
  sendLabelUpdate(
    entityID: string,
    label: string | undefined,
  ): Promise<void> | void
  sendTagsUpdate(
    entityID: string,
    tags: string[] | undefined,
  ): Promise<void> | void
}
