// import { Entity, EntityContext, IVector2, PixiEntity, Rigidbody } from "@dreamlab/engine";
// import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
// import { DebugSquare } from "./_debug.ts";
// import { Facades } from "./manager.ts";

// export class EditorFacadeRigidbody extends PixiEntity {
//   static {
//     Entity.registerType(this, "@editor");
//     Facades.register(Rigidbody, this);
//   }

//   static readonly icon = Rigidbody.icon;
//   get bounds(): Readonly<IVector2> | undefined {
//     return { x: 1, y: 1 };
//   }

//   #debug: DebugSquare | undefined;

//   type: Rigidbody["type"] = "fixed";

//   constructor(ctx: EntityContext) {
//     super(ctx, false);
//     this.defineValues(EditorFacadeRigidbody, "type");
//   }

//   onInitialize(): void {
//     super.onInitialize();
//     if (!this.container) return;

//     this.#debug = new DebugSquare({ entity: this });
//   }
// }

// type _HasAllValues = EnsureCompatible<
//   Omit<EntityValueProps<Rigidbody>, "body" | "collider">,
//   EntityValueProps<EditorFacadeRigidbody>
// >;
