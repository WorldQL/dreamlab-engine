import {
  Camera,
  ClientGame,
  Empty,
  Entity,
  EntityContext,
  EntityDestroyed,
  EntityReparented,
  IBounds,
  PixiEntity,
  Value,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { EditorFacadeComplexCollider } from "./complex-collider.ts";
import { Facades } from "./manager.ts";
import { SelectedEntityService } from "../../client/ui/selected-entity.ts";

const SIZE = 0.2;

export class EmptyFacade extends PixiEntity {
  static readonly icon: string = Empty.icon;

  static {
    Entity.registerType(this, "@editor");
    Facades.register(Empty, this);
  }

  public isFolder: boolean = false;

  get icon(): string {
    return this.isFolder ? "🗂️" : Empty.icon;
  }

  get isColliderChildAndSelected(): boolean {
    const selectedService = SelectedEntityService.serviceForGame(this.game as ClientGame);
    if (!selectedService) return false;
    return (
      this.parent instanceof EditorFacadeComplexCollider &&
      (selectedService.entities.includes(this.parent) ||
        selectedService.entities.some(e => e.parent === this.parent)) // sibling or self selected
    );
  }

  get bounds(): IBounds | undefined {
    if (this.isColliderChildAndSelected) {
      if (!this.#zoomFn) return undefined;
      const [zoom] = this.#zoomFn;

      const size = SIZE / zoom.value;
      return { width: size, height: size };
    }

    return undefined;
  }

  #zoomFn: [Value<number>, () => void] | undefined;

  constructor(ctx: EntityContext) {
    super(ctx, false);

    this.defineValue(EmptyFacade, "isFolder", {
      hidden: _ => {
        return !this.id.startsWith("world/EditEntities/prefabs");
      },
      description: "Marks this empty as a folder for organizing prefabs",
      replicated: true,
      persistent: true,
    });

    const camera = Camera.getActive(this.game);
    const zoom = camera?.values.get("zoom");
    if (zoom) {
      const fn = () => {
        this.#redraw();
      };

      this.#zoomFn = [zoom as Value<number>, fn];
      zoom.onChanged(fn);
    }

    this.on(EntityDestroyed, () => {
      if (this.#zoomFn) {
        const [zoom, fn] = this.#zoomFn;
        zoom.removeChangeListener(fn);

        this.#zoomFn = undefined;
      }

      if (this.#selectionListener) {
        this.#selectionListener.unsubscribe();
      }
    });

    this.on(EntityReparented, () => {
      this.#redraw();
    });
  }

  #selectionListener:
    | {
        unsubscribe: () => void;
      }
    | undefined = undefined;

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#gfx = new PIXI.Graphics();
    this.container.addChild(this.#gfx);

    this.#redraw();

    setTimeout(() => {
      const selectedService = SelectedEntityService.serviceForGame(this.game as ClientGame);
      this.#selectionListener = selectedService?.listen(() => {
        this.#redraw();
      });
    });
  }

  #gfx: PIXI.Graphics | undefined;
  #redraw(): void {
    if (!this.#gfx) return;
    this.#gfx.clear();

    if (!this.enabled) return;
    if (!this.isColliderChildAndSelected) return;

    if (!this.#zoomFn) return;
    const [zoom] = this.#zoomFn;

    const size = SIZE / zoom.value;
    this.#gfx.alpha = 0.8;
    this.#gfx
      .regularPoly(0, 0, size / 2, 4)
      .fill("#ffcf36")
      .stroke({
        color: 0x000000,
        width: 0.1 * size,
        alignment: 0,
      });
  }
}
