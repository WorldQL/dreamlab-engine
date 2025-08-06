import { Entity, EntityContext, enumAdapter, PixiEntity, Rigidbody } from "@dreamlab/engine";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { Facades } from "./manager.ts";

type RigidBodyType = (typeof rigidbodyTypes)[number];
const rigidbodyTypes = [
  "dynamic",
  "fixed",
  // "kinematic-position",
  // "kinematic-velocity",
  // TODO: Implement these nicely
] as const;

export const RigidbodyTypeAdapter = enumAdapter(rigidbodyTypes);

export class EditorFacadeRigidbody extends PixiEntity {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(Rigidbody, this);
  }

  type: RigidBodyType = "dynamic";

  static readonly icon = Rigidbody.icon;
  readonly bounds = undefined;

  constructor(ctx: EntityContext) {
    super(ctx, false);
    this.defineValue(EditorFacadeRigidbody, "type", {
      type: RigidbodyTypeAdapter,
      description: "Defines the type of the rigidbody, such as dynamic or fixed.",
    });
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<EntityValueProps<Rigidbody>, "body">,
  EntityValueProps<EditorFacadeRigidbody>
>;
