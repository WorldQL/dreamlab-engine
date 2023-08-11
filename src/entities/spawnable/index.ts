import { createBouncyBall } from './bouncyBall.js'
import { createComplexSolid } from './complexSolid.js'
import { createMarker } from './marker.js'
import { createNonsolid } from './nonsolid.js'
import { createSimpleNPC } from './simpleNPC.js'
import { createSolid } from './solid.js'
import type { Game } from '~/game.js'

export const registerDefaultSpawnables = (game: Game<boolean>) => {
  game.register('BouncyBall', createBouncyBall)
  game.register('ComplexSolid', createComplexSolid)
  game.register('Marker', createMarker)
  game.register('Nonsolid', createNonsolid)
  game.register('SimpleNPC', createSimpleNPC)
  game.register('Solid', createSolid)
}
