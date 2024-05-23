import { ServerGame } from "./game.ts";
import { EntityDescendentSpawned } from "./signals/entity-lifecycle.ts";
import { SquareEntity } from "./entities/square.ts";

const game = new ServerGame();

game.world.on(EntityDescendentSpawned, ({ descendent }) => {
  console.log("[+]", descendent);
});

const parent = game.world.spawn({
  type: SquareEntity,
  name: "DefaultSquare",
  children: [
    {
      type: SquareEntity,
      name: "Child",
    },
  ],
});
game.tick();

const child = parent._.Child;

console.log("+(10, 0) +(5, 0):");
parent.transform.position.x = 10.0;
child.transform.position.x = 5.0;
console.log(child.globalTransform.position);

console.log("\nrotate parent 90°:");
parent.transform.rotation = Math.PI / 2;
console.log(child.globalTransform.position);

console.log("\nset global y = -2.5:");
child.globalTransform.position.y = -2.5;
console.log(child.globalTransform.position);

console.log("\nrotate back to normal:");
parent.transform.rotation = 0;
console.log(child.globalTransform.position);

console.log();
console.log(parent);
