import type { Game } from '~/game.js'
import { createBouncyBall } from './bouncyBall.js'
import { createComplexSolid } from './complexSolid.js'
import { createMarker } from './marker.js'
import { createNonsolid } from './nonsolid.js'
import { createSimpleNPC } from './simpleNPC.js'
import { createSolid } from './solid.js'

export const registerDefaultSpawnables = (game: Game<boolean>) => {
  game.register('@dreamlab/BouncyBall', createBouncyBall)
  game.register('@dreamlab/ComplexSolid', createComplexSolid)
  game.register('@dreamlab/Marker', createMarker)
  game.register('@dreamlab/Nonsolid', createNonsolid)
  game.register('@dreamlab/SimpleNPC', createSimpleNPC)
  game.register('@dreamlab/Solid', createSolid)
}
