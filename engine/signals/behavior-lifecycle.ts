import { Behavior } from "../mod.ts";
import { exclusiveSignalType } from "../signal.ts";

export class BehaviorDestroyed {
  [exclusiveSignalType] = Behavior;
}
