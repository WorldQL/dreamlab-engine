import { ConnectionInfo } from "../network.ts";

export class PlayerJoined {
  constructor(public connection: ConnectionInfo) {}
}
export class PlayerLeft {
  constructor(public connection: ConnectionInfo) {}
}
