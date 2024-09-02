// import { Entity, EntityContext, IVector2, PixiEntity, Rigidbody2D } from "@dreamlab/engine";
// import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
// import { DebugSquare } from "./_debug.ts";
// import { Facades } from "./manager.ts";

// export class EditorFacadeRigidbody2D extends PixiEntity {
//   static {
//     Entity.registerType(this, "@editor");
//     Facades.register(Rigidbody2D, this);
//   }

//   static readonly icon = Rigidbody2D.icon;
//   get bounds(): Readonly<IVector2> | undefined {
//     return { x: 1, y: 1 };
//   }

//   #debug: DebugSquare | undefined;

//   type: Rigidbody2D["type"] = "fixed";

//   constructor(ctx: EntityContext) {
//     super(ctx, false);
//     this.defineValues(EditorFacadeRigidbody2D, "type");
//   }

//   onInitialize(): void {
//     super.onInitialize();
//     if (!this.container) return;

//     this.#debug = new DebugSquare({ entity: this });
//   }
// }

// type _HasAllValues = EnsureCompatible<
//   Omit<EntityValueProps<Rigidbody2D>, "body" | "collider">,
//   EntityValueProps<EditorFacadeRigidbody2D>
// >;
