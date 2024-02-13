import type { Path } from 'dot-path-value'
import type { Vector } from 'matter-js'
import type { Container } from 'pixi.js'
import type { Except } from 'type-fest'
import type { z } from 'zod'
import type { Camera } from '~/entities/camera'
import type { InitContext, RenderTime, Time } from '~/entity'
import type { Game } from '~/game'
import type { Bounds } from '~/math/bounds'
import type { TrackedTransform } from '~/math/transform'
import type { Physics } from '~/physics'
import type { SpawnableDefinition } from '~/spawnable/definition'
import { SpawnableEntity } from '~/spawnable/spawnableEntity'
import type {
  PreviousArgs,
  SpawnableConstructor,
  SpawnableContext,
  ZodObjectAny,
} from '~/spawnable/spawnableEntity'
import type { Ref } from '~/utils/ref'
import { game } from './magic'

interface LegacyInitContext {
  game: Game<boolean>
  physics: Physics
}

interface LegacyInitContextClient extends Except<InitContext, 'game'> {
  game: Game<false>
}

interface LegacyRenderContext {
  container: HTMLDivElement
  canvas: HTMLCanvasElement

  stage: Container
  camera: Camera
}

export interface LegacySpawnableEntity<
  Data = unknown,
  Render = unknown,
  ArgsSchema extends ZodObjectAny = ZodObjectAny,
> {
  init(init: LegacyInitContext): Data
  initRenderContext(
    init: LegacyInitContextClient,
    render: LegacyRenderContext,
  ): Render

  onPhysicsStep?(time: Time, data: Data): void
  onRenderFrame?(time: RenderTime, data: Data, render: Render): void

  teardownRenderContext(render: Render): void
  teardown(data: Data): void

  onClick?(data: Data, render: Render, position: Vector): void
  onArgsUpdate?<T extends Path<z.infer<ArgsSchema>>>(
    path: T,
    previousArgs: z.infer<ArgsSchema>,
    data: Data,
    render: Render | undefined,
  ): void
  onResize?(bounds: Bounds): void

  rectangleBounds(): Bounds | undefined
  isPointInside(position: Vector): boolean
}

export interface LegacySpawnableContext<
  Args extends Record<string, unknown> = Record<string, unknown>,
> extends Except<
    Required<SpawnableDefinition>,
    'args' | 'entity' | 'label' | 'transform'
  > {
  label: string | undefined
  transform: TrackedTransform
  preview: boolean
  definition: SpawnableDefinition<Args>
  selected: Ref<boolean>
}

export const createSpawnableEntity = <
  ArgsSchema extends ZodObjectAny,
  T extends LegacySpawnableEntity<Data, Render, ArgsSchema>,
  Data,
  Render,
>(
  _argsSchema: ArgsSchema,
  fn: (
    ctx: LegacySpawnableContext<z.infer<ArgsSchema>> & {
      _this: SpawnableEntity<ArgsSchema>
    },
    args: z.infer<ArgsSchema>,
  ) => T,
): SpawnableConstructor<ArgsSchema> =>
  class extends SpawnableEntity<ArgsSchema> {
    readonly #inner: LegacySpawnableEntity<Data, Render, ArgsSchema>

    private readonly _data: Data
    private readonly _render: Render | undefined

    public constructor(ctx: SpawnableContext<ArgsSchema>) {
      super(ctx)

      const _game = game()
      const context: InitContext = { game: _game, physics: _game.physics }

      this.#inner = fn.bind(this)({ ...ctx, _this: this }, this.args)
      this._data = this.#inner.init(context)

      if (_game.client) {
        this._render = this.#inner.initRenderContext(
          context,
          _game.client.render,
        )
      }
    }

    public override teardown(): void {
      if (!this._data) throw new Error('invalid data access')
      this.#inner.teardown(this._data)

      if (game('client')) {
        if (!this._render) throw new Error('invalid render data access')
        this.#inner.teardownRenderContext(this._render)
      }
    }

    public override bounds(): Bounds | undefined {
      return this.#inner.rectangleBounds()
    }

    public override isPointInside(point: Vector): boolean {
      return this.#inner.isPointInside(point)
    }

    public override onClick(position: Vector): void {
      if (!this._data) throw new Error('invalid data access')
      if (!this._render) throw new Error('invalid render data access')

      this.#inner.onClick?.(this._data, this._render, position)
    }

    public override onArgsUpdate(
      path: string,
      previousArgs: PreviousArgs<ArgsSchema>,
    ): void {
      if (!this._data) throw new Error('invalid data access')

      this.#inner.onArgsUpdate?.(
        // @ts-expect-error string narrowing
        path,
        previousArgs,
        this._data,
        this._render,
      )
    }

    public override onResize(bounds: Bounds): void {
      this.#inner.onResize?.(bounds)
    }

    public override onPhysicsStep(time: Time): void {
      if (!this._data) throw new Error('invalid data access')

      this.#inner.onPhysicsStep?.(time, this._data)
    }

    public override onRenderFrame(time: RenderTime): void {
      if (!this._data) throw new Error('invalid data access')
      if (!this._render) throw new Error('invalid render data access')

      this.#inner.onRenderFrame?.(time, this._data, this._render)
    }
  }

export const dataManager = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getData(entity: SpawnableEntity): any {
    // @ts-expect-error Hacky access
    return entity._data
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRenderData(entity: SpawnableEntity): any {
    // @ts-expect-error Hacky access
    return entity._render
  },
} as const
