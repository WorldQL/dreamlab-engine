import type { Game } from '~/game'
import { Background, BackgroundArgs } from './background.js'
import {
  BackgroundTrigger,
  BackgroundTriggerArgs,
} from './backgroundTrigger.js'
import { BouncyBall, BouncyBallArgs } from './bouncyBall.js'
import { ComplexSolidArgs, createComplexSolid } from './complexSolid.js'
import { ForceField, ForceFieldArgs } from './forceField.js'
import { Marker, MarkerArgs } from './marker.js'
import { NonSolid, NonSolidArgs } from './nonsolid'
import { MovingPlatform, MovingPlatformArgs } from './platform-moving.js'
import { Platform, PlatformArgs } from './platform.js'
import { Solid } from './solid'

export const registerDefaultSpawnables = (game: Game<boolean>) => {
  game.register('@dreamlab/Background', Background, BackgroundArgs)
  game.register(
    '@dreamlab/BackgroundTrigger',
    BackgroundTrigger,
    BackgroundTriggerArgs,
  )
  game.register('@dreamlab/BouncyBall', BouncyBall, BouncyBallArgs)
  game.register('@dreamlab/ComplexSolid', createComplexSolid, ComplexSolidArgs)
  game.register('@dreamlab/ForceField', ForceField, ForceFieldArgs)
  game.register('@dreamlab/Marker', Marker, MarkerArgs)
  game.register('@dreamlab/Nonsolid', NonSolid, NonSolidArgs)
  game.register('@dreamlab/Platform', Platform, PlatformArgs)
  game.register('@dreamlab/MovingPlatform', MovingPlatform, MovingPlatformArgs)
  game.register('@dreamlab/Solid', Solid, NonSolidArgs)
}
