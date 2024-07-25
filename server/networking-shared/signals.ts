import { PeerInfo } from "@dreamlab/engine";

export class PeerConnected {
  constructor(public peer: PeerInfo) {}
}
export class PeerDisconnected {
  constructor(public peer: PeerInfo) {}
}

export class ReceivedInitialNetworkSnapshot {}
