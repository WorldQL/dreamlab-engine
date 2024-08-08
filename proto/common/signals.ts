import { ConnectionInfo } from "@dreamlab/engine";

export class PlayerConnectionEstablished {
  constructor(public connection: ConnectionInfo) {}
}
export class PlayerConnectionDropped {
  constructor(public connection: ConnectionInfo) {}
}

export class ReceivedInitialNetworkSnapshot {}
