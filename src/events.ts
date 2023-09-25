import EventEmitter from 'eventemitter3'
import type { Player } from '~/entities/player.js'

interface ClientEvents {
  onPlayerSpawned: [player: Player]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ServerEvents {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CommonEvents {
  // TODO
}

class ClientEventManager extends EventEmitter<ClientEvents> {}
class ServerEventManager extends EventEmitter<ServerEvents> {}
class CommonEventManager extends EventEmitter<CommonEvents> {}

export interface EventsManager<Server extends boolean> {
  client: Server extends false ? ClientEventManager : undefined
  server: Server extends true ? ServerEventManager : undefined
  common: CommonEventManager
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
  }
}
