import { TilingSprite, Vector2 } from "@dreamlab/engine";
import { serializeEntityDefinition } from "@dreamlab/proto/common/entity-sync.ts";
import { Decoder, Encoder } from "@dreamlab/vendor/cbor-x.ts";
import { equal } from "jsr:@std/assert@1";
import { game } from "../game.ts";

const encoder = new Encoder();
const decoder = new Decoder();

const sprite = game.world.spawn({ type: TilingSprite, name: "TilingSprite" });
sprite.tilePosition = new Vector2(10, 10);

const desc = serializeEntityDefinition(game, sprite.getDefinition(), game.world.ref);
console.log(desc);
console.log();
console.log("=============");
console.log();

const encoded = encoder.encode(desc);
const decoded = decoder.decode(encoded);

console.log(decoded);
console.log();

console.log(`equal: ${equal(desc, decoded)}`);
