import { CharacterController, Entity, EntityContext } from "@dreamlab/engine";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { EditorFacadeCollider } from "./collider.ts";
import { Facades } from "./manager.ts";

export class EditorFacadeCharacterController extends EditorFacadeCollider {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(CharacterController, this);
  }

  public static override readonly icon = CharacterController.icon;

  public offset: number = 0.0625;
  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValue(EditorFacadeCharacterController, "offset", {
      description: "Adjusts the offset for the character controller.",
    });
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<
    EntityValueProps<CharacterController>,
    "collider" | "isGrounded" | "teleport" | "correctedPosition"
  >,
  EntityValueProps<EditorFacadeCharacterController>
>;
