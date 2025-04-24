import { Behavior, syncedValue } from "@dreamlab/engine";

export default class Spawnpoint extends Behavior {
  @syncedValue()
  spawned: boolean = false;
}
