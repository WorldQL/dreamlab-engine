import { Behavior, syncedValue } from "@dreamlab/engine";

export default class Synced extends Behavior {
  @syncedValue()
  count: number = 0
}
