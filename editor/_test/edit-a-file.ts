import { NIL_UUID } from "jsr:@std/uuid@1/constants";

const instanceId = NIL_UUID;
await fetch(
  `http://127.0.0.1:8000/api/v1/edit/${instanceId}/files/src/../src/../a/b/c/../../../src/my-file.ts`,
  {
    method: "PUT",
    body: `// test script :)
import { Behavior, BehaviorContext } from "@dreamlab/engine";
export default class MyBehavior extends Behavior {
  a: number = 1;
  b: number = 2;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValue(MyBehavior, "a");
    // this.defineValue(MyBehavior, "b");
  }

  onInitialize() {
    console.log("Hello, world!");
  }
}`,
    headers: {
      "Content-Type": "application/octet-stream",
    },
  },
);
