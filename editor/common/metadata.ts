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

  readonly bounds = undefined;

  static getExistingInstanceFor(entity: Entity): EditorMetadataEntity | undefined {
    const existingMetadataEntity = entity.children.get("__EditorMetadata");
    if (
      existingMetadataEntity !== undefined &&
      existingMetadataEntity instanceof EditorMetadataEntity
    ) {
      return existingMetadataEntity;
    }

    return undefined;
  }

  static getInstanceFor(entity: Entity): EditorMetadataEntity {
    const existing = EditorMetadataEntity.getExistingInstanceFor(entity);
    if (existing) return existing;

    const metadataEntity = entity.spawn({
      type: EditorMetadataEntity,
      name: "__EditorMetadata",
    });

    return metadataEntity;
  }

  static getLockedBy(entity: Entity): Entity | undefined {
    // TODO: we should probably propagate this down so that we don't have to
    // traverse up the graph every time we want to check lock state

    let e: Entity | undefined = entity;
    while (e !== undefined) {
      const metadata = EditorMetadataEntity.getExistingInstanceFor(e);
      if (metadata && metadata.locked) {
        return e;
      }

      e = e.parent;
    }

    return undefined;
  }
}
