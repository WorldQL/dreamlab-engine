import { ServerGame } from "./game.ts";
import { EntityDescendentSpawned } from "./signals/entity-lifecycle.ts";
import { BasicEntity } from "./entity/entities/basic.ts";
import { BasicLivingEntity } from "./entity/entities/basic-living.ts";

const game = new ServerGame({
  instanceId: "0",
  worldId: "dummy-world",
});
await game.initialize();

game.world.on(EntityDescendentSpawned, ({ descendent }) => {
  console.log("[+]", descendent);
});

const parent = game.world.spawn({
  type: BasicEntity,
  name: "DefaultSquare",
  children: [
    {
      type: BasicEntity,
      name: "Child",
    },
  ],
});
game.tick(); // EntitySpawned events fire on the next tick after spawn, so force-tick here

const child = parent._.Child; // shorthand for parent.children.get("Child")

console.log("+(10, 0) +(5, 0):");
parent.transform.position.x = 10.0;
child.transform.position.x = 5.0;
console.log(child.globalTransform.position);
console.log(child.transform.position);

console.log("\nrotate parent 90°:");
parent.transform.rotation = Math.PI / 2;
console.log(child.globalTransform.position);
console.log(child.transform.position);

console.log("\nset global y = -2.5:");
child.globalTransform.position.y = -2.5;
console.log(child.globalTransform.position);
console.log(child.transform.position);

console.log("\nrotate back to normal:");
parent.transform.rotation = 0;
console.log(child.globalTransform.position);
console.log(child.transform.position);

console.log();
console.log(parent);

const squareWithHealth = game.world.spawn({
  type: BasicLivingEntity,
  name: "SquareWithHealth.001",
  values: {
    health: 100,
  },
});
squareWithHealth.set({ health: 250.0, maxHealth: 500.0 });

console.log("\nconflicting child:");

parent.spawn({
  type: BasicEntity,
  name: child.name,
});
console.log([...parent.children.values()]);
