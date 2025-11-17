import { Entity, EntityContext, enumAdapter, RenderContainer } from "@dreamlab/engine";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { Facades } from "./manager.ts";

type ScaleFilterMode = enumAdapter.Union<typeof ScaleFilterModeAdapter>;
const ScaleFilterModeAdapter = enumAdapter(["default", "linear", "nearest"]);

export class EditorFacadeRenderContainer extends Entity {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(RenderContainer, this);
  }

  public static override readonly icon = RenderContainer.icon;
  readonly bounds = undefined;

  resolution: number = 256;
  antialiased: boolean = true;
  scaleFilterMode: ScaleFilterMode = "default";

  constructor(ctx: EntityContext) {
    super(ctx);

    this.defineValue(EditorFacadeRenderContainer, "resolution", {
      description: "", // TODO
    });

    this.defineValue(EditorFacadeRenderContainer, "antialiased", {
      description: "", // TODO
    });

    this.defineValue(EditorFacadeRenderContainer, "scaleFilterMode", {
      type: ScaleFilterModeAdapter,
      description: "The scale filter mode used for texture scaling (default, linear, nearest).",
    });
  }
}

type _HasAllValues = EnsureCompatible<
  EntityValueProps<RenderContainer>,
  EntityValueProps<EditorFacadeRenderContainer>
>;
