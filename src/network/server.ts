export interface NetServer {
  type: 'server'
  // TODO
}

export const createNetServer = (): NetServer => {
  const net: NetServer = {
    type: 'server',
  }

  return Object.freeze(net)
}
