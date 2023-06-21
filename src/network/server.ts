export interface NetServer {
  type: 'server'
  // TODO
}

export const createNetServer = (): NetServer => ({ type: 'server' })
