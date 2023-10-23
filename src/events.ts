import EventEmitter from 'eventemitter3'
import type Matter from 'matter-js'
import type { NetPlayer } from '~/entities/netplayer'
import type { Player } from '~/entities/player.js'
import type { Entity, RenderTime, Time } from '~/entity.js'
import type {
  PlayerInventory,
  PlayerInventoryItem,
} from '~/managers/playerInventory.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'

export interface ClientEvents {
  onRenderFrame: [time: RenderTime]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ServerEvents {
  // TODO
}

export type CollisionEvent = [
  pair: readonly [a: SpawnableEntity, b: SpawnableEntity],
  raw: Matter.Collision,
]

export type PlayerCollisionEvent = [
  pair: readonly [player: Player, other: Matter.Body],
  raw: Matter.Collision,
]

export interface CommonEvents {
  onInstantiate: [entity: Entity]
  onDestroy: [entity: Entity]
  onSpawn: [entity: SpawnableEntity]

  onPhysicsStep: [time: Time]
  onCollisionStart: CollisionEvent
  onCollisionActive: CollisionEvent
  onCollisionEnd: CollisionEvent

  onPlayerCollisionStart: PlayerCollisionEvent
  onPlayerCollisionActive: PlayerCollisionEvent
  onPlayerCollisionEnd: PlayerCollisionEvent

  onPlayerJoin: [player: NetPlayer]
  onPlayerLeave: [player: NetPlayer]

  onPlayerAttack: [player: Player, item: PlayerInventoryItem]

  onInventoryAddItem: [item: PlayerInventoryItem, inventory: PlayerInventory]
  onInventoryRemoveItem: [item: PlayerInventoryItem, inventory: PlayerInventory]
  onPlayerSwitchedItem: [
    item: PlayerInventoryItem | undefined,
    inventory: PlayerInventory,
  ]
}

class ClientEventManager extends EventEmitter<ClientEvents> {}
class ServerEventManager extends EventEmitter<ServerEvents> {}
class CommonEventManager extends EventEmitter<CommonEvents> {}

export interface EventsManager<Server extends boolean> {
  client: Server extends false ? ClientEventManager : undefined
  server: Server extends true ? ServerEventManager : undefined
  common: CommonEventManager
}

export type Event = keyof ClientEvents | keyof CommonEvents | keyof ServerEvents
export type EventArgs<T extends Event> = T extends keyof ClientEvents
  ? ClientEvents[T]
  : T extends keyof ServerEvents
  ? ServerEvents[T]
  : T extends keyof CommonEvents
  ? CommonEvents[T]
  : never

export type EventHandler<T extends Event> = (...args: EventArgs<T>) => void

export const createEventsManager = <Server extends boolean>(
  isServer: Server,
): EventsManager<Server> => {
  return {
    // @ts-expect-error Generic type coersion
    client: isServer === false ? new ClientEventManager() : undefined,

    // @ts-expect-error Generic type coersion
    server: isServer === true ? new ServerEventManager() : undefined,

    common: new CommonEventManager(),
  }
}
