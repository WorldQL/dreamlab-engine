import { Camera, Entity, EntityContext } from "@dreamlab/engine";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { IVector2 } from "../../../engine/math/vector/vector2.ts";

export class EditorFacadeCamera extends Entity {
  public smooth: number = 0.01;
  public unlocked: boolean = false;
  public active: boolean = false;

  readonly bounds: Readonly<IVector2> = Object.freeze({
    x: Camera.TARGET_VIEWPORT_SIZE,
    y: Camera.TARGET_VIEWPORT_SIZE,
  });

  // prettier-ignore
  get container(): Camera["container"] { throw new Error("Method not implemented."); }
  // prettier-ignore
  get smoothed(): Camera["smoothed"] { throw new Error("Method not implemented."); }

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValues(EditorFacadeCamera, "active", "smooth", "unlocked");
  }
}
Entity.registerType(EditorFacadeCamera, "@editor");

type _Check = EnsureCompatible<EntityValueProps<Camera>, EntityValueProps<EditorFacadeCamera>>;
