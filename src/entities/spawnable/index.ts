import type { Game } from '~/game.js'
import { createBackground } from './background.js'
import { createBackgroundTrigger } from './backgroundTrigger.js'
import { createBouncyBall } from './bouncyBall.js'
import { createComplexSolid } from './complexSolid.js'
import { createForceField } from './forceField.js'
import { createMarker } from './marker.js'
import { createNonsolid } from './nonsolid.js'
import { createPlatform } from './platform.js'
import { createSimpleNPC } from './simpleNPC.js'
import { createSolid } from './solid.js'

export const registerDefaultSpawnables = (game: Game<boolean>) => {
  game.register('@dreamlab/Background', createBackground)
  game.register('@dreamlab/BackgroundTrigger', createBackgroundTrigger)
  game.register('@dreamlab/BouncyBall', createBouncyBall)
  game.register('@dreamlab/ComplexSolid', createComplexSolid)
  game.register('@dreamlab/ForceField', createForceField)
  game.register('@dreamlab/Marker', createMarker)
  game.register('@dreamlab/Nonsolid', createNonsolid)
  game.register('@dreamlab/SimpleNPC', createSimpleNPC)
  game.register('@dreamlab/Solid', createSolid)
  game.register('@dreamlab/Platform', createPlatform)
}
