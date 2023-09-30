import EventEmitter from 'eventemitter3'
import type { Entity, RenderTime, Time } from '~/entity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'
import { Player } from './entities/player'

interface ClientEvents {
  onRenderFrame: [time: RenderTime]
}

interface ServerEvents {
  // TODO: emit these so scripts can respond by saving/load data, setting position, etc.
  onPlayerJoin: [player: Player]
  onPlayerQuit: [player: Player]
}

interface CommonEvents {
  onInstantiate: [entity: Entity]
  onDestroy: [entity: Entity]
  onSpawn: [entity: SpawnableEntity]

  onPhysicsStep: [time: Time]
}

class ClientEventManager extends EventEmitter<ClientEvents> {}
class ServerEventManager extends EventEmitter<ServerEvents> {}
class CommonEventManager extends EventEmitter<CommonEvents> {}
class CustomEventManager extends EventEmitter<any> {}

export interface EventsManager<Server extends boolean> {
  client: Server extends false ? ClientEventManager : undefined
  server: Server extends true ? ServerEventManager : undefined
  common: CommonEventManager
  custom: CustomEventManager
}

export const createEventsManager = <Server extends boolean>(
  isServer: Server,
): EventsManager<Server> => {
  return {
    // @ts-expect-error Generic type coersion
    client: isServer === false ? new ClientEventManager() : undefined,

    // @ts-expect-error Generic type coersion
    server: isServer === true ? new ServerEventManager() : undefined,

    common: new CommonEventManager(),

    custom: new CustomEventManager(),
  }
}
