import { Empty, Entity } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";

export abstract class EditorRootFacadeEntity extends Empty {
  override get protected() {
    return true;
  }
}

export class WorldRootFacade extends EditorRootFacadeEntity {
  static readonly icon: string = "🌐";
  static {
    Entity.registerType(this, "@editor");
  }

  get name(): string {
    return "world";
  }
}

export class LocalRootFacade extends EditorRootFacadeEntity {
  static readonly icon: string = "💻";
  static {
    Entity.registerType(this, "@editor");
  }

  get name(): string {
    return "local";
  }
}

export class ServerRootFacade extends EditorRootFacadeEntity {
  static readonly icon: string = "📡";
  static {
    Entity.registerType(this, "@editor");
  }

  get name(): string {
    return "server";
  }
}

export class PrefabRootFacade extends EditorRootFacadeEntity {
  static readonly icon: string = "📝";
  static {
    Entity.registerType(this, "@editor");
  }

  #localHidden: boolean = false;
  override get enabled() {
    return super.enabled && !this.#localHidden;
  }
  override set enabled(v) {
    super.enabled = v;
  }

  get localHidden() {
    return this.#localHidden;
  }
  set localHidden(hidden: boolean) {
    this.#localHidden = hidden;

    const enabled = this.enabled;
    this[internal.entityNotifyEnableChanged](enabled);
  }

  get name(): string {
    return "prefabs";
  }
}
