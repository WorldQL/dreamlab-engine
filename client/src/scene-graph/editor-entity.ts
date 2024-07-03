import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Entity, EntityContext, JsonObject, PixiEntity } from "@dreamlab/engine";
import { EditorObjectValue } from "./editor-object-value.ts";

// Mock entity used for the Editor that renders shell representations of real entities
export class EditorEntity extends PixiEntity {
  entityTypeName: string = "";
  entityValues: JsonObject = {};
  entityBehaviors: JsonObject = {};

  constructor(ctx: EntityContext) {
    super(ctx);

    this.value(EditorEntity, "entityTypeName");
    this.value(EditorEntity, "entityValues", { type: EditorObjectValue });
    this.value(EditorEntity, "entityBehaviors", { type: EditorObjectValue });

    // TODO: render entity façade via pixi
  }
}
Entity.registerType(EditorEntity, "@editor");
