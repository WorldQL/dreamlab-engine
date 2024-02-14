import Matter from 'matter-js'
import { AnimatedSprite, Container } from 'pixi.js'
import type { RenderTime } from '~/entity'
import { Entity } from '~/entity'
import { camera, debug, isClient, physics, stage } from '~/labs/magic'
import type { Gear } from '~/managers/gear'
import type { Bounds } from '~/math/bounds'
import type { Vector } from '~/math/vector'
import { Vec } from '~/math/vector'
import type { PlayerAnimationMap } from '~/textures/playerAnimations'
import { loadCharacterAnimations } from '~/textures/playerAnimations'
import type { BoxGraphics } from '~/utils/draw'
import { drawBox } from '~/utils/draw'
import type { KnownAnimation } from './animations'

export abstract class BasePlayer extends Entity {
  protected static readonly PLAYER_MASS = 50
  protected static readonly PLAYER_SPRITE_SCALE = 0.9
  protected static readonly PLAYER_ANIMATION_SPEED = 0.4
  protected static readonly PLAYER_SPRITE_ANCHOR = [0.45, 0.535] as const
  protected readonly stroke: string = 'blue'

  public readonly body: Matter.Body
  public readonly bounds: Bounds
  protected facing: 'left' | 'right' = 'left'

  protected _characterId: string | undefined
  protected _animations: PlayerAnimationMap<KnownAnimation> | undefined
  protected _currentAnimation: KnownAnimation = 'idle'
  protected _gear: Gear | undefined

  protected container: Container | undefined
  protected gfx: BoxGraphics | undefined
  protected sprite: AnimatedSprite | undefined

  public get position(): Vector {
    return this.body.position
  }

  public constructor(
    characterId: string | undefined,
    { width = 80, height = 370 }: Partial<Bounds> = {},
  ) {
    super()

    this.body = Matter.Bodies.rectangle(0, 0, width, height, {
      label: 'player',
      render: { visible: false },

      inertia: Number.POSITIVE_INFINITY,
      inverseInertia: 0,
      mass: BasePlayer.PLAYER_MASS,
      inverseMass: 1 / BasePlayer.PLAYER_MASS,
      friction: 0,

      collisionFilter: {
        category: 0x002,
      },
    })

    if (isClient()) {
      this.container = new Container()
      this.container.sortableChildren = true
      this.container.zIndex = 10

      this.gfx = drawBox({ width, height }, { stroke: this.stroke })
      this.container.addChild(this.gfx)

      stage().addChild(this.container)
    }

    this.bounds = { width, height }
    this.characterId = characterId

    // TODO: Implement BasePlayer
  }

  public override teardown(): void {
    physics().clearPlayer()

    this.container?.destroy({ children: true })
  }

  public get characterId(): string | undefined {
    return this._characterId
  }

  public set characterId(value: string | undefined) {
    this._characterId = value
    void this._loadAnimations()
  }

  private async _loadAnimations(): Promise<void> {
    // Only load animations on the client
    if (!isClient() || !this.container) return

    this._animations = await loadCharacterAnimations(this._characterId)
    const textures = this._animations[this._currentAnimation].textures

    if (this.sprite) this.sprite.textures = textures
    else {
      this.sprite = new AnimatedSprite(textures)
      this.sprite.zIndex = 10
      this.sprite.animationSpeed = BasePlayer.PLAYER_ANIMATION_SPEED
      this.sprite.scale.set(BasePlayer.PLAYER_SPRITE_SCALE)
      this.sprite.anchor.set(...BasePlayer.PLAYER_SPRITE_ANCHOR)
      this.sprite.play()

      this.container.addChild(this.sprite)
    }
  }

  public get gear(): Gear | undefined {
    return this._gear
  }

  public set gear(value: Gear | undefined) {
    this._gear = value
  }

  public override onRenderFrame({ smooth }: RenderTime): void {
    const smoothed = Vec.add(
      this.body.position,
      Vec.mult(this.body.velocity, smooth),
    )

    const pos = Vec.add(smoothed, camera().offset)
    if (this.container) this.container.position = pos
    if (this.gfx) this.gfx.alpha = debug() ? 0.5 : 0
  }
}
