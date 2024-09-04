import { Behavior, Empty, enumAdapter } from "@dreamlab/engine";

const HelloWorldAdapter = enumAdapter(["hello", "world"]);

class EnumBehavior extends Behavior {
  value: enumAdapter.Union<typeof HelloWorldAdapter> = "hello";

  onInitialize(): void {
    const value = this.defineValue(EnumBehavior, "value", { type: HelloWorldAdapter });
    value.onChanged(() => {
      console.log("new value:", this.value);
    });
  }
}

export const entity = game.world.spawn({
  type: Empty,
  name: Empty.name,
  behaviors: [{ type: EnumBehavior }],
});

export const behavior = entity.getBehavior(EnumBehavior);
