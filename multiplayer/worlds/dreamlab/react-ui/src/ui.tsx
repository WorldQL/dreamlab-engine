/** @jsxImportSource npm:react */
import {
  Behavior,
  BehaviorDestroyed,
  Entity,
  EntityRef,
  syncedValue,
  UILayer,
} from "@dreamlab/engine";
import { useSyncExternalStore } from "npm:react";
import { createRoot, type Root } from "npm:react-dom/client";
import Synced from "./synced.ts";

export default class UI extends Behavior {
  #ui = this.entity.cast(UILayer);
  #root: Root | undefined = undefined;

  @syncedValue(EntityRef)
  sync: Entity | undefined;

  onInitialize(): void {
    if (!this.game.isClient()) return;

    if (!this.sync) throw new Error("missing sync entity");
    const synced = this.sync.getBehavior(Synced);

    this.#ui.element.style.pointerEvents = "auto";
    this.#root = createRoot(this.#ui.element);
    this.on(BehaviorDestroyed, () => {
      this.#root?.unmount();
    });

    const Root = () => {
      const count = useSyncExternalStore(
        listener => {
          const value = synced.values.get("count");
          value?.onChanged(listener);

          return () => {
            value?.removeChangeListener(listener);
          };
        },
        () => synced.count,
      );

      return (
        <div>
          <p>Count: {count}</p>
          <button onClick={() => (synced.count += 1)}>Increment</button>
        </div>
      );
    };

    this.#root.render(<Root />);
  }
}
