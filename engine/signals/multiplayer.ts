import type { ConnectionInfo } from "@dreamlab/engine";

export class PlayerJoined {
  constructor(public connection: ConnectionInfo) {}
}
export class PlayerLeft {
  constructor(public connection: ConnectionInfo) {}
}
