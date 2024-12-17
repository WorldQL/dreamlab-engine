import { CharacterController, Entity } from "@dreamlab/engine";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { EditorFacadeCollider } from "./collider.ts";
import { Facades } from "./manager.ts";

export class EditorFacadeCharacterController extends EditorFacadeCollider {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(CharacterController, this);
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<EntityValueProps<CharacterController>, "collider" | "isGrounded">,
  EntityValueProps<EditorFacadeCharacterController>
>;
