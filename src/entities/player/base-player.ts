import Matter from 'matter-js'
import { AnimatedSprite, Container, Sprite } from 'pixi.js'
import type { RenderTime } from '~/entity'
import { Entity } from '~/entity'
import { camera, debug, isClient, physics, stage } from '~/labs/magic'
import type { Gear } from '~/managers/gear'
import type { Bounds } from '~/math/bounds'
import type { Vector } from '~/math/vector'
import { Vec } from '~/math/vector'
import type { Bone, PlayerAnimationMap } from '~/textures/playerAnimations'
import { bones, loadCharacterAnimations } from '~/textures/playerAnimations'
import type { BoxGraphics } from '~/utils/draw'
import { drawBox } from '~/utils/draw'
import type { KnownAnimation } from './animations'
import { getSpeedMultiplier, isAttackAnimation } from './animations'

export abstract class BasePlayer extends Entity {
  protected static readonly PLAYER_MASS = 50
  protected static readonly PLAYER_SPRITE_SCALE = 0.9
  protected static readonly PLAYER_ANIMATION_SPEED = 0.4
  protected static readonly PLAYER_SPRITE_ANCHOR = [0.45, 0.535] as const
  protected readonly stroke: string = 'blue'

  public readonly body: Matter.Body
  public readonly bounds: Bounds
  public readonly bones: Readonly<Record<Bone, Vector>>
  protected _facing: 'left' | 'right' = 'left'
  protected _currentFrame = 0

  public get facing(): 'left' | 'right' {
    return this._facing
  }

  protected _characterId: string | undefined
  public get characterId(): string | undefined {
    return this._characterId
  }

  public set characterId(value: string | undefined) {
    if (this._characterId === value) return

    this._characterId = value
    void this._loadAnimations()
  }

  protected animations: PlayerAnimationMap<KnownAnimation> | undefined
  private _currentAnimation: KnownAnimation = 'idle'

  public get currentAnimation(): KnownAnimation {
    return this._currentAnimation
  }

  protected set currentAnimation(value: KnownAnimation) {
    if (this._currentAnimation === value) return
    this._currentAnimation = value

    if (!this.sprite || !this.animations) return

    this.sprite.textures = this.animations[value].textures
    this.sprite.animationSpeed =
      BasePlayer.PLAYER_ANIMATION_SPEED * getSpeedMultiplier(value, this.gear)

    this.sprite.loop = value !== 'jump'
    this.sprite.gotoAndPlay(0)
  }

  protected _gear: Gear | undefined
  public get gear(): Gear | undefined {
    return this._gear
  }

  public set gear(value: Gear | undefined) {
    this._gear = value
    if (this.gearSprite && value) this.gearSprite.texture = value.texture
  }

  protected container: Container | undefined
  protected gfx: BoxGraphics | undefined
  protected sprite: AnimatedSprite | undefined
  protected gearSprite: Sprite | undefined

  public get position(): Vector {
    return Vec.clone(this.body.position)
  }

  public get velocity(): Vector {
    return Vec.clone(this.body.velocity)
  }

  readonly #bonePosition = (bone: Bone): Vector => {
    if (!this.animations) {
      throw new Error('player has no animations')
    }

    const animation = this.animations[this.currentAnimation]
    const animW = animation.width
    const animH = animation.height
    const position = animation.boneData.bones[bone][this._currentFrame]

    if (!position) {
      throw new Error(
        `missing bone data for "${this.currentAnimation}" at frame ${this._currentFrame}`,
      )
    }

    const flip = this.sprite ? Math.sign(this.sprite.scale.x) : 1
    const normalized = {
      x: flip === 1 ? position.x : animW - position.x,
      y: position.y,
    }

    const offsetFromCenter: Vector = {
      x: (1 - (normalized.x / animW) * 2) * (animW / -2),
      y: (1 - (normalized.y / animH) * 2) * (animH / -2),
    }

    const offsetFromAnchor = Vec.add(offsetFromCenter, {
      x: flip * ((1 - BasePlayer.PLAYER_SPRITE_ANCHOR[0] * 2) * (animW / 2)),
      y: (1 - BasePlayer.PLAYER_SPRITE_ANCHOR[1] * 2) * (animH / 2),
    })

    const scaled = Vec.mult(offsetFromAnchor, BasePlayer.PLAYER_SPRITE_SCALE)
    return Vec.add(this.body.position, scaled)
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

      this.gearSprite = new Sprite(this.gear?.texture)
      this.gearSprite.width = 200
      this.gearSprite.height = 200

      stage().addChild(this.gearSprite)
      stage().addChild(this.container)
    }

    this.bounds = { width, height }
    this.characterId = characterId
    void this._loadAnimations()

    const boneMap = {} as Readonly<Record<Bone, Vector>>
    for (const bone of bones) {
      Object.defineProperty(boneMap, bone, {
        get: () => this.#bonePosition(bone),
      })
    }

    this.bones = Object.freeze(boneMap)

    // TODO: Implement BasePlayer
  }

  public override teardown(): void {
    physics().clearPlayer()

    this.container?.destroy({ children: true })
  }

  private async _loadAnimations(): Promise<void> {
    // Only load animations on the client
    if (!isClient() || !this.container) return

    this.animations = await loadCharacterAnimations(this._characterId)
    const textures = this.animations[this._currentAnimation].textures

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

  public override onRenderFrame({ smooth }: RenderTime): void {
    if (!this.container) return
    if (!this.sprite) return
    if (!this.gfx) return
    if (!this.gearSprite) return

    this._currentFrame = this.sprite.currentFrame

    const scale = this._facing === 'left' ? 1 : -1
    const newScale = scale * BasePlayer.PLAYER_SPRITE_SCALE
    if (this.sprite.scale.x !== newScale) {
      this.sprite.scale.x = newScale
    }

    const smoothed = Vec.add(
      this.body.position,
      Vec.mult(this.body.velocity, smooth),
    )

    const pos = Vec.add(smoothed, camera().offset)
    this.container.position = pos
    this.gfx.alpha = debug() ? 0.5 : 0

    // TODO: Feet sensor

    if (this.gear && this.animations) {
      this.gearSprite.visible =
        isAttackAnimation(this.currentAnimation) &&
        this.currentAnimation !== 'punch'

      const handMapping: Record<string, 'handLeft' | 'handRight'> = {
        handLeft: 'handLeft',
        handRight: 'handRight',
      }

      const currentGear = this.gear
      const currentHandKey = currentGear.bone ?? 'handLeft'
      const mappedHand = handMapping[currentHandKey]

      const pos = Vec.add(
        {
          x: this.bones[mappedHand as 'handLeft' | 'handRight'].x,
          y: this.bones[mappedHand as 'handLeft' | 'handRight'].y,
        },
        camera().offset,
      )

      this.gearSprite.position = pos

      const animation = this.animations[this.currentAnimation]
      const handOffsets =
        animation.boneData.handOffsets[mappedHand as 'handLeft' | 'handRight'][
          this._currentFrame
        ]

      let handRotation = Math.atan2(
        handOffsets!.y.y - handOffsets!.x.y,
        handOffsets!.y.x - handOffsets!.x.x,
      )
      let itemRotation = -currentGear.rotation * (Math.PI / 180)

      itemRotation *= scale === -1 ? -1 : 1
      handRotation *= scale === -1 ? -1 : 1
      this.gearSprite.rotation = handRotation + itemRotation

      const initialDimensions = {
        width: this.gearSprite.width,
        height: this.gearSprite.height,
      }

      this.gearSprite.scale.x = -scale
      Object.assign(this.gearSprite, initialDimensions)

      this.gearSprite.anchor.set(currentGear.anchor.x, currentGear.anchor.y)
    } else {
      this.gearSprite.visible = false
    }
  }
}
