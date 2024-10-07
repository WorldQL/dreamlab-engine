import * as internal from "@dreamlab/engine/internal";
import {
  Entity,
  EntityStore,
  LocalRoot,
  PrefabsRoot,
  ServerRoot,
  WorldRoot,
} from "./entity/mod.ts";
import { ClientGame, Game, ServerGame } from "./game.ts";
import { createPhysicsRealm, PhysicsRealm } from "./physics.ts";

export class BaseScene {
  readonly entities: EntityStore = new EntityStore();

  [internal.entityTickingOrderDirty]: boolean = false;
  [internal.entityTickingOrder]: Entity[] = [];

  [internal.scenePhysicsRealm]: PhysicsRealm;
  physics: { world: PhysicsRealm["world"] };

  readonly world: WorldRoot;
  readonly prefabs: PrefabsRoot;

  constructor(game: Game) {
    if (!(this instanceof ClientScene || this instanceof ServerScene))
      throw new Error("BaseScene is sealed to ClientScene and ServerScene!");
    const scene = this as unknown as Scene;

    this.world = new WorldRoot(scene, game);
    this.prefabs = new PrefabsRoot(scene, game);
    this[internal.scenePhysicsRealm] = createPhysicsRealm(game);
    this.physics = { world: this[internal.scenePhysicsRealm].world };
  }
}
export class ClientScene extends BaseScene {
  readonly server = undefined;
  readonly local: LocalRoot;

  constructor(game: ClientGame) {
    super(game);
    this.local = new LocalRoot(this, game);
  }
}
export class ServerScene extends BaseScene {
  readonly local = undefined;
  readonly server: ServerRoot;

  constructor(game: ServerGame) {
    super(game);
    this.server = new ServerRoot(this, game);
  }
}
export type Scene = ClientScene | ServerScene;

export function tickScene(game: Game, scene: Scene) {
  // TODO: fire ScenePreTick

  const tickOrder = scene[internal.entityTickingOrder];
  if (scene[internal.entityTickingOrderDirty]) {
    tickOrder.length = 0;
    buildTickingOrder(scene, tickOrder);
    scene[internal.entityTickingOrderDirty] = false;
  }
  const entityCount = tickOrder.length;
  for (let i = 0; i < entityCount; i++) {
    tickOrder[i][internal.interpolationStartTick]();
  }
  const physRealm = scene[internal.scenePhysicsRealm];
  game.physics.tick(scene.entities, physRealm.world, physRealm.events);
  for (let i = 0; i < entityCount; i++) {
    tickOrder[i].onUpdate();
  }

  // TODO: fire ScenePostTick
}

export function buildTickingOrder(scene: Scene, tickOrder: Entity[]) {
  scene.world[internal.submitEntityTickingOrder](tickOrder);
  if (scene.local) scene.local[internal.submitEntityTickingOrder](tickOrder);
  if (scene.server) scene.server[internal.submitEntityTickingOrder](tickOrder);
}
