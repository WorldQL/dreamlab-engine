import type { Game } from '~/game'
import { ArgsSchema as BackgroundArgs, createBackground } from './background.js'
import {
  ArgsSchema as BackgroundTriggerArgs,
  createBackgroundTrigger,
} from './backgroundTrigger.js'
import { BouncyBall, ArgsSchema as BouncyBallArgs } from './bouncyBall.js'
import {
  ArgsSchema as ComplexSolidArgs,
  createComplexSolid,
} from './complexSolid.js'
import { createForceField, ArgsSchema as ForceFieldArgs } from './forceField.js'
import { createMarker, ArgsSchema as MarkerArgs } from './marker.js'
import { NonSolid, ArgsSchema as NonSolidArgs } from './nonsolid'
import { MovingPlatform } from './platform-moving.js'
import { Platform, ArgsSchema as PlatformArgs } from './platform.js'
import { Solid } from './solid'

export const registerDefaultSpawnables = (game: Game<boolean>) => {
  game.register('@dreamlab/Background', createBackground, BackgroundArgs)
  game.register(
    '@dreamlab/BackgroundTrigger',
    createBackgroundTrigger,
    BackgroundTriggerArgs,
  )
  game.register('@dreamlab/BouncyBall', BouncyBall, BouncyBallArgs)
  game.register('@dreamlab/ComplexSolid', createComplexSolid, ComplexSolidArgs)
  game.register('@dreamlab/ForceField', createForceField, ForceFieldArgs)
  game.register('@dreamlab/Marker', createMarker, MarkerArgs)
  game.register('@dreamlab/Nonsolid', NonSolid, NonSolidArgs)
  game.register('@dreamlab/Platform', Platform, PlatformArgs)
  game.register('@dreamlab/MovingPlatform', MovingPlatform, PlatformArgs)
  game.register('@dreamlab/Solid', Solid, NonSolidArgs)
}
