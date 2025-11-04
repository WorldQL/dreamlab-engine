import type {
  Entity,
  Game,
  Input,
  ISignalHandler,
  IVector2,
  Signal,
  SignalConstructor,
  SignalListener,
  SignalListenerOptions,
  SignalMatching,
  SignalSubscription,
} from "@dreamlab/engine";
import {
  Action,
  ActionBound,
  ActionCreated,
  ActionDeleted,
  Camera,
  Click,
  DefaultSignalHandlerImpls,
  isInput,
  MouseDown,
  MouseMove,
  MouseOut,
  MouseOver,
  MouseUp,
  Scroll,
  Vector2,
} from "@dreamlab/engine";
import { actionSetHeld, inputsRegisterHandlers } from "@dreamlab/engine/internal";

// TODO: Scroll and cursor position support

export type Cursor = {
  // TODO: Readonly Vectors
  readonly world: Vector2 | undefined;
  readonly screen: Vector2 | undefined;
};

export class Inputs implements ISignalHandler {
  readonly #game: Game;
  constructor(game: Game) {
    this.#game = game;
  }

  // #region Keys
  #keys = new Set<Input>();
  getKey(key: Input): boolean {
    return this.#keys.has(key);
  }
  // #endregion

  // #region Actions
  #actions = new Map<string, Action>();

  public get actions(): readonly Action[] {
    return Object.freeze([...this.#actions.values()]);
  }

  public get bindings(): readonly (readonly [action: Action, input: Input | undefined])[] {
    return Object.freeze(
      this.#actions
        .values()
        // @ts-ignore This breaks in typedef-gen. something wrong with shim?
        .map(action => [action, action.binding] as const)
        .toArray(),
    );
  }

  public get(action: string): Action | undefined {
    return this.#actions.get(action);
  }

  public create(name: string, label: string, defaultBinding: Input): Action {
    const cached = this.#actions.get(name);
    if (cached) return cached;

    const action = new Action(name, label, defaultBinding, this.#game);
    action.on(ActionBound, this.#onBind);

    this.#actions.set(name, action);
    this.fire(ActionCreated, action);

    return action;
  }

  public remove(action: string | Action): void {
    const _action = typeof action === "string" ? this.#actions.get(action) : action;

    if (!_action) {
      throw new Error(`unknown action: ${action}`);
    }

    _action.unregister(ActionBound, this.#onBind);

    // TODO: Internal remove all listeners
    // _action.removeAllListeners();

    this.#actions.delete(_action.name);
    this.fire(ActionDeleted, _action);
  }

  #clearActions = () => {
    for (const action of this.actions.values()) {
      action[actionSetHeld](false, 0);
    }
  };
  // #endregion

  // #region Cursor
  #screenCursor: Vector2 | undefined = undefined;
  get cursor(): Cursor {
    const game = this.#game;

    return {
      screen: this.#screenCursor,
      get world() {
        if (!this.screen) {
          return undefined;
        }

        const camera = Camera.getActive(game);
        if (!camera) {
          return undefined;
        }
        return camera.screenToWorld(this.screen);
      },
    };
  }
  // #endregion

  // #region Event Handlers
  // #region Keyboard
  #onKeyDown = (ev: KeyboardEvent) => this.#onKey(ev, true);
  #onKeyUp = (ev: KeyboardEvent) => this.#onKey(ev, false);

  #onKey = (ev: KeyboardEvent, pressed: boolean) => {
    // Ignore repeat events
    if (ev.repeat) return;

    const input = ev.code;
    if (!isInput(input)) return;

    if (pressed) this.#keys.add(input);
    else this.#keys.delete(input);

    const tick = this.#game.time.ticks;
    for (const action of this.actions.values()) {
      if (action.binding !== input) continue;
      action[actionSetHeld](pressed, tick);
    }
  };
  // #endregion

  // #region Mouse
  #onMouseDown = (ev: MouseEvent) => this.#onMouse(ev, true);
  #onMouseUp = (ev: MouseEvent) => this.#onMouse(ev, false);
  #onTouchStart = (ev: TouchEvent) => {
    // Ensure the touch event is on the game canvas
    // @ts-expect-error: we know it's a client game
    if (ev.target !== this.#game.renderer.app.canvas) {
      return;
    }

    // Get the first touch point
    const touch = ev.touches[0];
    const touchPos = { x: touch.clientX, y: touch.clientY } satisfies IVector2;

    // Get the canvas and its bounding rectangle
    // @ts-expect-error: we know it's a client game
    const canvas = this.#game.renderer.app.canvas as HTMLCanvasElement;
    const canvasRect = canvas.getBoundingClientRect();

    // Calculate canvas-relative coordinates
    const canvasCoords = {
      x: touchPos.x - canvasRect.x,
      y: touchPos.y - canvasRect.y,
    } satisfies IVector2;

    // Update the cursor position
    this.#screenCursor = new Vector2(canvasCoords);

    const cursor = this.cursor;
    const input: Input = "MouseLeft";
    const button = "left";

    // Fire MouseDown and Click events with updated cursor positions
    if (cursor.screen && cursor.world) {
      this.fire(MouseDown, button, { screen: cursor.screen, world: cursor.world }, ev);
      this.fire(Click, { screen: cursor.screen, world: cursor.world });
    }

    // Update the action bindings
    const tick = this.#game.time.ticks;
    for (const action of this.actions.values()) {
      if (action.binding !== input) continue;
      action[actionSetHeld](true, tick);
    }
  };

  #onMouse = (ev: MouseEvent, pressed: boolean) => {
    // @ts-expect-error: we know its a client game
    if (ev.target !== this.#game.renderer.app.canvas) {
      return;
    }

    const input: Input | undefined =
      ev.button === 0
        ? "MouseLeft"
        : ev.button === 1
          ? "MouseMiddle"
          : ev.button === 2
            ? "MouseRight"
            : undefined;

    // required to allow focusing the game if it's in an iframe
    if (input !== "MouseLeft") {
      ev.preventDefault();
    }

    if (!input) return;
    const button =
      input === "MouseLeft" ? "left" : input === "MouseMiddle" ? "middle" : "right";

    const cursor = this.cursor;
    if (pressed) {
      this.#keys.add(input);
      if (cursor.screen && cursor.world) {
        this.fire(MouseDown, button, { screen: cursor.screen, world: cursor.world }, ev);
        if (button === "left") this.fire(Click, { screen: cursor.screen, world: cursor.world });
      }
    } else {
      this.#keys.delete(input);
      this.fire(MouseUp, button, cursor, ev);
    }

    const tick = this.#game.time.ticks;
    for (const action of this.actions.values()) {
      if (action.binding !== input) continue;
      action[actionSetHeld](pressed, tick);
    }
  };

  #onMouseOut = (ev: MouseEvent) => {
    this.#screenCursor = undefined;
    this.fire(MouseOut, { screen: undefined, world: undefined }, ev);
  };

  #onMouseMove = (ev: MouseEvent) => {
    const mouse = { x: ev.clientX, y: ev.clientY } satisfies IVector2;

    // @ts-expect-error: we know its a client game
    const canvas = this.#game.renderer.app.canvas as HTMLCanvasElement;
    const canvasRect = canvas.getBoundingClientRect();
    const canvasCoords = {
      x: mouse.x - canvasRect.x,
      y: mouse.y - canvasRect.y,
    } satisfies IVector2;

    const over = this.#isOverCanvas(ev, canvas, canvasRect, canvasCoords);
    if (this.#screenCursor === undefined && over) {
      // mouse over
      this.#screenCursor = new Vector2(canvasCoords);

      const { world } = this.cursor;
      if (world) this.fire(MouseOver, { screen: this.#screenCursor, world }, ev);
    } else if (this.#screenCursor === undefined && !over) {
      // do nothing
    } else if (this.#screenCursor !== undefined && over) {
      // mouse move
      this.#screenCursor.assign(canvasCoords);

      const { world } = this.cursor;
      if (world) this.fire(MouseMove, { screen: this.#screenCursor, world }, ev);
    } else if (this.#screenCursor !== undefined && !over) {
      // mouse out
      this.#screenCursor = undefined;
      this.fire(MouseOut, { screen: undefined, world: undefined }, ev);
    }
  };

  #isOverCanvas(
    ev: MouseEvent,
    canvas: HTMLCanvasElement,
    canvasRect: DOMRect,
    canvasCoords: IVector2,
  ): boolean {
    const target = ev.target as HTMLElement | null;
    if (target === null) return false;
    if (target === canvas) return true;

    return (
      canvasCoords.x >= 0 &&
      canvasCoords.x <= canvasRect.width &&
      canvasCoords.y >= 0 &&
      canvasCoords.y <= canvasRect.height
    );
  }

  #onWheel = (ev: WheelEvent) => {
    const scale = Camera.METERS_TO_PIXELS;
    this.fire(Scroll, new Vector2({ x: ev.deltaX / scale, y: ev.deltaY / scale }), ev);
  };
  // #endregion

  #onBind = (ev: ActionBound) => {
    this.fire(ActionBound, ev.action, ev.input);
  };

  #onVisibilityChange = () => {
    if (document.visibilityState === "hidden") this.#clearActions();
  };

  #onContextMenu = (ev: MouseEvent) => {
    ev.preventDefault();
  };

  [inputsRegisterHandlers](): () => void {
    if (!this.#game.isClient()) {
      throw new Error("registerHandlers() can only be called on the client");
    }
    if (this.#game.headless) {
      return () => {};
    }

    const controller = new AbortController();
    const signal = controller.signal;

    globalThis.addEventListener("keydown", this.#onKeyDown, { signal });
    globalThis.addEventListener("keyup", this.#onKeyUp, { signal });
    globalThis.addEventListener("mousedown", this.#onMouseDown, { signal });
    globalThis.addEventListener("touchstart", this.#onTouchStart, { signal });
    globalThis.addEventListener("mouseup", this.#onMouseUp, { signal });
    globalThis.addEventListener("wheel", this.#onWheel, { signal, passive: false });
    globalThis.addEventListener("blur", this.#clearActions, { signal });
    globalThis.addEventListener("pointermove", this.#onMouseMove, { signal });
    globalThis.addEventListener("mouseout", this.#onMouseOut, { signal });
    document.addEventListener("visibilitychange", this.#onVisibilityChange, { signal });

    const canvas = this.#game.renderer.app.canvas;
    canvas.addEventListener("contextmenu", this.#onContextMenu, { signal });

    return () => {
      controller.abort();
    };
  }
  // #endregion

  // #region Signals
  readonly signalSubscriptionMap = DefaultSignalHandlerImpls.map();

  fire<C extends SignalConstructor>(
    type: C,
    ...params: ConstructorParameters<C>
  ): C extends SignalConstructor<infer S> ? S : object {
    return DefaultSignalHandlerImpls.fire(this, type, ...params);
  }

  on<S extends Signal>(
    type: SignalConstructor<SignalMatching<S, this & Entity>>,
    listener: SignalListener<SignalMatching<S, this & Entity>>,
    options?: SignalListenerOptions,
  ): SignalSubscription<S> {
    const subscription = DefaultSignalHandlerImpls.on(this, type, listener, options);
    return subscription as SignalSubscription<S>;
  }

  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>): void {
    DefaultSignalHandlerImpls.unregister(this, type, listener);
  }
  // #endregion
}
