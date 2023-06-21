export interface NetClient {
  type: 'client'
  // TODO
}

export const createNetClient = (): NetClient => ({ type: 'client' })
