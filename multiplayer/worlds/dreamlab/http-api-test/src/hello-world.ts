import { Behavior } from "@dreamlab/engine";
import * as z from "@dreamlab/vendor/zod.ts";

export default class HelloWorld extends Behavior {
  // try (with httpie): http POST 'http://127.0.0.1:8001/api/v1/instance/00000000-0000-0000-0000-000000000000/call' 'identifier=greet' 'params[]=world'
  onInitializeServer(): void {
    if (!this.game.isServer()) return;
    this.game.httpAPI.attach("greet", [z.string()], who => `Hello, ${who}!`);
  }
}
