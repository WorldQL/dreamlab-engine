import { Entity, EntityContext } from "@dreamlab/engine";

export class EditorMetadataEntity extends Entity {
  static readonly icon: string = "…";
  static {
    Entity.registerType(this, "@editor");
  }

  get name(): string {
    return "__EditorMetadata";
  }

  locked: boolean = false;

  // TODO: it would be cool to have a way to sync json changes without replacing the whole object all the time
  // (e.g. a snapshotted append log of fine-grained property sets i.e. obj[path] = val) but this works for now lol
  behaviorsJson: string = "[]";

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValues(EditorMetadataEntity, "locked", "behaviorsJson");
  }

  readonly bounds = { x: 0, y: 0 };
}
