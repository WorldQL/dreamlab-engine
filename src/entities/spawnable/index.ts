import { createBouncyBall } from './bouncyBall.js'
import { createComplexSolid } from './complexSolid.js'
import { createMarker } from './marker.js'
import { createNonsolid } from './nonsolid.js'
import { createSimpleNPC } from './simpleNPC.js'
import { createSolid } from './solid.js'
import type { Game } from '~/game.js'

export const registerDefaultSpawnables = (game: Game<boolean>) => {
  game.register('createBouncyBall', createBouncyBall)
  game.register('createComplexSolid', createComplexSolid)
  game.register('createMarker', createMarker)
  game.register('createNonsolid', createNonsolid)
  game.register('createSimpleNPC', createSimpleNPC)
  game.register('createSolid', createSolid)
}
