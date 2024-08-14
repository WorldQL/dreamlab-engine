import { Empty, Entity } from "@dreamlab/engine";

export abstract class EditorRootFacadeEntity extends Empty {}

export class WorldRootFacade extends EditorRootFacadeEntity {
  public static readonly icon: string = "🏠";
  static {
    Entity.registerType(this, "@editor");
  }

  get name(): string {
    return "world";
  }
}

export class LocalRootFacade extends EditorRootFacadeEntity {
  public static readonly icon: string = "💻";
  static {
    Entity.registerType(this, "@editor");
  }

  get name(): string {
    return "local";
  }
}

export class ServerRootFacade extends EditorRootFacadeEntity {
  public static readonly icon: string = "🖧";
  static {
    Entity.registerType(this, "@editor");
  }

  get name(): string {
    return "server";
  }
}

export class PrefabRootFacade extends EditorRootFacadeEntity {
  public static readonly icon: string = "🌐";
  static {
    Entity.registerType(this, "@editor");
  }

  get name(): string {
    return "prefabs";
  }
}
