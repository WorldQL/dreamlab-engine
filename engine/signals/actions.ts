import type { Input } from "@dreamlab/engine";
import { Action, exclusiveSignalType, Inputs } from "@dreamlab/engine";

export class ActionCreated {
  constructor(public readonly action: Action) {}
  [exclusiveSignalType] = Inputs;
}
export class ActionDeleted {
  constructor(public readonly action: Action) {}
  [exclusiveSignalType] = Inputs;
}
export class ActionBound {
  constructor(
    public readonly action: Action,
    public readonly input: Input | undefined,
  ) {}
  [exclusiveSignalType] = Action;
}

export class ActionPressed {
  [exclusiveSignalType] = Action;
}
export class ActionReleased {
  [exclusiveSignalType] = Action;
}
export class ActionChanged {
  constructor(public readonly value: boolean) {}
  [exclusiveSignalType] = Action;
}
