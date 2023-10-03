import EventEmitter from 'eventemitter3'
import type { NetPlayer } from '~/entities/netplayer'
import type { Entity, RenderTime, Time } from '~/entity.js'
import type { SpawnableEntity } from '~/spawnable/spawnableEntity.js'

interface ClientEvents {
  onRenderFrame: [time: RenderTime]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ServerEvents {
  // TODO
}

interface CommonEvents {
  onInstantiate: [entity: Entity]
  onDestroy: [entity: Entity]
  onSpawn: [entity: SpawnableEntity]

  onPhysicsStep: [time: Time]

  onPlayerJoin: [player: NetPlayer]
  onPlayerLeave: [player: NetPlayer]
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
