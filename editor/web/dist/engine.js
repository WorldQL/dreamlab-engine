// deno polyfills for browser
Symbol.dispose ??= Symbol.for("Symbol.dispose");
Symbol.asyncDispose ??= Symbol.for("Symbol.asyncDispose");
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../engine/behavior/behavior.ts
import { generateCUID as generateCUID2 } from "@dreamlab/vendor/cuid.js";

// ../engine/signal.ts
var exclusiveSignalType = Symbol.for("dreamlab.exclusiveSignalType");
var BasicSignalHandler = class {
  static {
    __name(this, "BasicSignalHandler");
  }
  #signalListenerMap = /* @__PURE__ */ new Map();
  fire(ctor, ...args) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners)
      return;
    const signal = new ctor(...args);
    listeners.forEach((l) => l(signal));
  }
  on(type, listener) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener);
    this.#signalListenerMap.set(type, listeners);
  }
  unregister(type, listener) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners)
      return;
    const idx = listeners.indexOf(listener);
    if (idx !== -1)
      listeners.splice(idx, 1);
  }
};

// ../engine/signals/behavior-lifecycle.ts
var BehaviorDestroyed = class {
  static {
    __name(this, "BehaviorDestroyed");
  }
  [exclusiveSignalType] = Behavior;
};

// ../engine/entity/entity.ts
import { generateCUID } from "@dreamlab/vendor/cuid.js";

// ../engine/internal.ts
var internalEntity = Symbol.for("dreamlab.internal.internalEntity");
var preTickEntities = Symbol.for("dreamlab.internal.preTickEntities");
var tickEntities = Symbol.for("dreamlab.internal.tickEntities");
var updateInterpolation = Symbol.for("dreamlab.internal.updateInterpolation");
var setValueRegistrySource = Symbol.for("dreamlab.internal.setValueRegistrySource");
var behaviorLoader = Symbol.for("dreamlab.internal.behaviorLoader");
var vectorOnChanged = Symbol.for("dreamlab.internal.vectorOnChanged");
var transformOnChanged = Symbol.for("dreamlab.internal.transformOnChanged");
var transformForceUpdate = Symbol.for("dreamlab.internal.transformForceUpdate");
var timeTick = Symbol.for("dreamlab.internal.timeTick");
var timeIncrement = Symbol.for("dreamlab.internal.timeIncrement");
var timeSetMode = Symbol.for("dreamlab.internal.timeSetMode");
var inputsRegisterHandlers = Symbol.for("dreamlab.internal.inputsRegisterHandlers");
var actionSetHeld = Symbol.for("dreamlab.internal.actionSetHeld");
var uiInit = Symbol.for("dreamlab.internal.uiInit");
var uiDestroy = Symbol.for("dreamlab.internal.uiDestroy");
var entityForceAuthorityValues = Symbol.for(
  "dreamlab.internal.entityForceAuthorityValues"
);
var entitySpawn = Symbol.for("dreamlab.internal.entitySpawn");
var entitySpawnFinalize = Symbol.for("dreamlab.internal.entitySpawnFinalize");
var entityAuthorityClock = Symbol.for("dreamlab.internal.entityAuthorityClock");
var entityStoreRegister = Symbol.for("dreamlab.internal.entityStoreRegister");
var entityStoreUnregister = Symbol.for("dreamlab.internal.entityStoreUnregister");
var entityStoreRegisterRoot = Symbol.for("dreamlab.internal.entityStoreRegisterRoot");

// ../engine/math/lerp.ts
var EPSILON = 1e-5;
function clamp01(value) {
  if (value < 0)
    return 0;
  if (value > 1)
    return 1;
  return value;
}
__name(clamp01, "clamp01");
function lerp(a, b, t) {
  return a + (b - a) * clamp01(t);
}
__name(lerp, "lerp");
function lerpUnclamped(a, b, t) {
  return a + (b - a) * t;
}
__name(lerpUnclamped, "lerpUnclamped");
var TAU = Math.PI * 2;
function lerpAngle(a, b, t) {
  const difference = (b - a) % TAU;
  const distance = 2 * difference % TAU - difference;
  return a + distance * t;
}
__name(lerpAngle, "lerpAngle");
function smoothLerp(current, target, decay, deltaTime, epsilon = EPSILON) {
  if (Math.abs(target - current) < epsilon) {
    return target;
  }
  return target + (current - target) * Math.exp(-decay * deltaTime);
}
__name(smoothLerp, "smoothLerp");

// ../engine/math/vector/vector2.ts
var Vector2 = class _Vector2 {
  static {
    __name(this, "Vector2");
  }
  [vectorOnChanged] = () => {
  };
  // #region Constants
  /** All zeroes. */
  static get ZERO() {
    return new _Vector2(0, 0);
  }
  /** All ones. */
  static get ONE() {
    return new _Vector2(1, 1);
  }
  /** All negative ones. */
  static get NEG_ONE() {
    return new _Vector2(-1, -1);
  }
  /** A unit vector pointing along the positive X axis. */
  static get X() {
    return new _Vector2(1, 0);
  }
  /** A unit vector pointing along the positive Y axis. */
  static get Y() {
    return new _Vector2(0, 1);
  }
  /** A unit vector pointing along the negative X axis. */
  static get NEG_X() {
    return new _Vector2(-1, 0);
  }
  /** A unit vector pointing along the negative Y axis. */
  static get NEG_Y() {
    return new _Vector2(0, -1);
  }
  // #endregion
  // #region Fields
  #x;
  #y;
  get x() {
    return this.#x;
  }
  set x(value) {
    if (value === this.#x)
      return;
    this.#x = value;
    this[vectorOnChanged]();
  }
  get y() {
    return this.#y;
  }
  set y(value) {
    if (value === this.#y)
      return;
    this.#y = value;
    this[vectorOnChanged]();
  }
  constructor(vectorOrX, y) {
    if (typeof vectorOrX === "object" && "x" in vectorOrX && "y" in vectorOrX) {
      this.#x = vectorOrX.x;
      this.#y = vectorOrX.y;
    } else if (typeof vectorOrX === "number" && typeof y === "number") {
      this.#x = vectorOrX;
      this.#y = y;
    } else {
      throw new TypeError("y was undefined");
    }
  }
  /**
   * Creates a vector with all elements set to {@link value}.
   */
  static splat(value) {
    return new _Vector2({ x: value, y: value });
  }
  clone() {
    return new _Vector2({ x: this.#x, y: this.#y });
  }
  bare() {
    return { x: this.#x, y: this.#y };
  }
  assign(value) {
    const xChanged = value.x !== void 0 && value.x !== this.#x;
    const yChanged = value.y !== void 0 && value.y !== this.#y;
    if (!xChanged && !yChanged)
      return false;
    if (value.x !== void 0 && xChanged) {
      this.#x = value.x;
    }
    if (value.y !== void 0 && yChanged) {
      this.#y = value.y;
    }
    this[vectorOnChanged]();
    return true;
  }
  // #region Methods
  // #region Equals
  static eq(a, b) {
    return a.x === b.x && a.y === b.y;
  }
  eq(other) {
    return _Vector2.eq(this, other);
  }
  // #endregion
  // #region Absolute
  static abs(vector) {
    return new _Vector2(Math.abs(vector.x), Math.abs(vector.y));
  }
  /**
   * Returns a vector containing the absolute value of each element.
   */
  abs() {
    return _Vector2.abs(this);
  }
  // #endregion
  // #region Negate
  static neg(vector) {
    return new _Vector2(-vector.x, -vector.y);
  }
  neg() {
    return _Vector2.neg(this);
  }
  // #endregion
  // #region Inverse
  static inverse(vector) {
    return new _Vector2(1 / vector.x, 1 / vector.y);
  }
  inverse() {
    return _Vector2.inverse(this);
  }
  // #endregion
  // #region Add
  static add(a, b) {
    return new _Vector2(a.x + b.x, a.y + b.y);
  }
  add(other) {
    return _Vector2.add(this, other);
  }
  // #endregion
  // #region Subtract
  static sub(a, b) {
    return new _Vector2(a.x - b.x, a.y - b.y);
  }
  sub(other) {
    return _Vector2.sub(this, other);
  }
  // #endregion
  // #region Multiply
  static mul(a, b) {
    if (typeof b === "number") {
      return new _Vector2(a.x * b, a.y * b);
    }
    return new _Vector2(a.x * b.x, a.y * b.y);
  }
  mul(other) {
    return _Vector2.mul(this, other);
  }
  // #endregion
  // #region Divide
  static div(a, b) {
    if (typeof b === "number") {
      return new _Vector2(a.x / b, a.y / b);
    }
    return new _Vector2(a.x / b.x, a.y / b.y);
  }
  div(other) {
    return _Vector2.div(this, other);
  }
  // #endregion
  // #region Magnitude
  /**
   * Returns the magnitude (length) of a vector.
   */
  static magnitude(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  }
  /**
   * Returns the magnitude (length) of this vector.
   */
  magnitude() {
    return _Vector2.magnitude(this);
  }
  // #endregion
  // #region Magnitude Squared
  /**
   * Returns the squared magnitude (length) of a vector.
   */
  static magnitudeSquared(vector) {
    return vector.x * vector.x + vector.y * vector.y;
  }
  /**
   * Returns the squared magnitude (length) of this vector.
   */
  magnitudeSquared() {
    return _Vector2.magnitudeSquared(this);
  }
  // #endregion
  // #region Normalize
  /**
   * Returns a new vector with the magnitude (length) normalized to 1.
   */
  static normalize(vector) {
    const magnitude = _Vector2.magnitude(vector);
    if (magnitude === 0)
      return new _Vector2(_Vector2.ZERO);
    return new _Vector2(vector.x / magnitude, vector.y / magnitude);
  }
  /**
   * Returns a new vector with the magnitude (length) normalized to 1.
   */
  normalize() {
    return _Vector2.normalize(this);
  }
  // #endregion
  // #region Look At
  /**
   * Returns the rotation required to look at the target vector.
   */
  static lookAt(vector, target) {
    const { x, y } = _Vector2.sub(target, vector);
    return -Math.atan2(x, y);
  }
  /**
   * Returns the rotation required to look at the target vector.
   */
  lookAt(target) {
    return _Vector2.lookAt(this, target);
  }
  // #endregion
  // #region Lerp
  static lerp(a, b, t) {
    return new _Vector2(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
  }
  static smoothLerp(current, target, decay, deltaTime, epsilon = EPSILON) {
    return new _Vector2(
      smoothLerp(current.x, target.x, decay, deltaTime, epsilon),
      smoothLerp(current.y, target.y, decay, deltaTime, epsilon)
    );
  }
  // #endregion
  // #region DistanceTo
  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  // #endregion
  // #endregion
  /**
   * @ignore
   */
  toString() {
    return `Vec2 { x: ${this.#x}, y: ${this.#y} }`;
  }
  /**
   * @ignore
   */
  toJSON() {
    return this.bare();
  }
  /**
   * @ignore
   */
  [Symbol.for("Deno.customInspect")](inspect, options) {
    return `${this.constructor.name} ${inspect(this.bare(), options)}`;
  }
};

// ../engine/math/entity-transform.ts
var Transform = class {
  static {
    __name(this, "Transform");
  }
  #position = new Vector2(0, 0);
  get position() {
    return this.#position;
  }
  set position(value) {
    this.#position = new Vector2(value);
    this.#assignSignalListeners();
    this[transformOnChanged]();
  }
  #scale = new Vector2(1, 1);
  get scale() {
    return this.#scale;
  }
  set scale(value) {
    this.#scale = new Vector2(value);
    this.#assignSignalListeners();
    this[transformOnChanged]();
  }
  #rotation = 0;
  get rotation() {
    return this.#rotation;
  }
  set rotation(value) {
    this.#rotation = value;
    this[transformOnChanged]();
  }
  #z = 0;
  get z() {
    return this.#z;
  }
  set z(value) {
    this.#z = value;
    this[transformOnChanged]();
  }
  #assignSignalListeners() {
    this.#position[vectorOnChanged] = () => {
      this[transformOnChanged]();
    };
    this.#scale[vectorOnChanged] = () => {
      this[transformOnChanged]();
    };
  }
  constructor(opts) {
    if (opts?.position) {
      const x = opts.position.x ?? 0;
      const y = opts.position.y ?? 0;
      this.#position = new Vector2(x, y);
    }
    if (opts?.scale) {
      const x = opts.scale.x ?? 1;
      const y = opts.scale.y ?? 1;
      this.#scale = new Vector2(x, y);
    }
    if (opts?.rotation)
      this.#rotation = opts.rotation;
    if (opts?.z)
      this.#z = opts.z;
    this.#assignSignalListeners();
  }
  [transformOnChanged] = () => {
  };
  [transformForceUpdate](transform) {
    this.#position = new Vector2(transform.position);
    this.#scale = new Vector2(transform.scale);
    this.#rotation = transform.rotation;
    this.#z = transform.z;
    this.#assignSignalListeners();
  }
  toJSON() {
    return {
      position: this.#position.bare(),
      rotation: this.#rotation,
      scale: this.#scale.bare(),
      z: this.#z
    };
  }
};

// ../engine/math/spatial-transforms.ts
var mult2x2 = /* @__PURE__ */ __name((a, b) => ({
  xx: a.xx * b.xx + a.xy * b.yx,
  xy: a.xx * b.xy + a.xy * b.yy,
  yx: a.yx * b.xx + a.yy * b.yx,
  yy: a.yx * b.xy + a.yy * b.yy
}), "mult2x2");
var mult2x2Point = /* @__PURE__ */ __name((m, p) => new Vector2(p.x * m.xx + p.y * m.xy, p.x * m.yx + p.y * m.yy), "mult2x2Point");
function transformWorldToLocal(parentWorldTransform, worldTransform) {
  const a = parentWorldTransform;
  const b = worldTransform;
  const inverseScale = {
    xx: 1 / a.scale.x,
    xy: 0,
    yx: 0,
    yy: 1 / a.scale.y
  };
  const th = a.rotation;
  const cth = Math.cos(-th);
  const sth = Math.sin(-th);
  const inverseRotation = {
    xx: cth,
    xy: -sth,
    yx: sth,
    yy: cth
  };
  const inverseM = mult2x2(inverseScale, inverseRotation);
  return new Transform({
    position: mult2x2Point(inverseM, b.position.sub(a.position)),
    scale: new Vector2(b.scale.x / a.scale.x, b.scale.y / a.scale.y),
    rotation: b.rotation - a.rotation,
    z: b.z - a.z
  });
}
__name(transformWorldToLocal, "transformWorldToLocal");
function transformLocalToWorld(parentWorldTransform, localTransform) {
  const a = parentWorldTransform;
  const b = localTransform;
  const scale = {
    xx: a.scale.x,
    xy: 0,
    yx: 0,
    yy: a.scale.y
  };
  const th = a.rotation;
  const cth = Math.cos(th);
  const sth = Math.sin(th);
  const rotation = {
    xx: cth,
    xy: -sth,
    yx: sth,
    yy: cth
  };
  const m = mult2x2(rotation, scale);
  return new Transform({
    position: mult2x2Point(m, b.position).add(a.position),
    scale: new Vector2(a.scale.x * b.scale.x, a.scale.y * b.scale.y),
    rotation: a.rotation + b.rotation,
    z: a.z + b.z
  });
}
__name(transformLocalToWorld, "transformLocalToWorld");
function pointLocalToWorld(worldTransform, localPoint) {
  const t = worldTransform;
  const scale = {
    xx: t.scale.x,
    xy: 0,
    yx: 0,
    yy: t.scale.y
  };
  const th = t.rotation;
  const cth = Math.cos(th);
  const sth = Math.sin(th);
  const rotation = {
    xx: cth,
    xy: -sth,
    yx: sth,
    yy: cth
  };
  const m = mult2x2(rotation, scale);
  return mult2x2Point(m, localPoint).add(t.position);
}
__name(pointLocalToWorld, "pointLocalToWorld");
function pointWorldToLocal(worldTransform, worldPoint) {
  const t = worldTransform;
  const inverseScale = {
    xx: 1 / t.scale.x,
    xy: 0,
    yx: 0,
    yy: 1 / t.scale.y
  };
  const th = t.rotation;
  const cth = Math.cos(-th);
  const sth = Math.sin(-th);
  const inverseRotation = {
    xx: cth,
    xy: -sth,
    yx: sth,
    yy: cth
  };
  const inverseM = mult2x2(inverseScale, inverseRotation);
  return mult2x2Point(inverseM, Vector2.sub(worldPoint, t.position));
}
__name(pointWorldToLocal, "pointWorldToLocal");

// ../engine/input/action.ts
var Action = class {
  static {
    __name(this, "Action");
  }
  #game;
  name;
  label;
  constructor(name, label, binding, game) {
    this.#game = game;
    this.name = name;
    this.label = label;
    this.#binding = binding;
  }
  #heldAt;
  /**
   * Set to `true` if the action is currently being held down.
   */
  get held() {
    return this.#heldAt !== void 0;
  }
  /**
   * Set to `true` on the frame that this action was pressed.
   */
  get pressed() {
    return this.#heldAt === this.#game.time.ticks - 1;
  }
  [actionSetHeld](value, tick) {
    this.#heldAt = value ? tick : void 0;
    if (this.#heldAt !== void 0)
      this.fire(ActionPressed);
    else
      this.fire(ActionReleased);
    this.fire(ActionChanged, value);
  }
  #binding;
  get binding() {
    return this.#binding;
  }
  set binding(value) {
    if (value === this.#binding)
      return;
    this.#binding = value;
    this.fire(ActionBound, this, value);
  }
  // #region Signals
  #signalListenerMap = /* @__PURE__ */ new Map();
  fire(ctor, ...args) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners)
      return;
    const signal = new ctor(...args);
    listeners.forEach((l) => l(signal));
  }
  on(type, listener) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener);
    this.#signalListenerMap.set(type, listeners);
  }
  unregister(type, listener) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners)
      return;
    const idx = listeners.indexOf(listener);
    if (idx !== -1)
      listeners.splice(idx, 1);
  }
  // #endregion
};

// ../engine/input/input.ts
var inputs = [
  // Letters
  "KeyA",
  "KeyB",
  "KeyC",
  "KeyD",
  "KeyE",
  "KeyF",
  "KeyG",
  "KeyH",
  "KeyI",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyM",
  "KeyN",
  "KeyO",
  "KeyP",
  "KeyQ",
  "KeyR",
  "KeyS",
  "KeyT",
  "KeyU",
  "KeyV",
  "KeyW",
  "KeyX",
  "KeyY",
  "KeyZ",
  // Digits
  "Digit0",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",
  // Special
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Enter",
  "Semicolon",
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "Space",
  "Tab",
  "Backspace",
  "BracketLeft",
  "BracketRight",
  "Backslash",
  "Backquote",
  "Delete",
  // Mouse
  "MouseLeft",
  "MouseRight",
  "MouseMiddle"
];
function isInput(input) {
  return inputs.includes(input);
}
__name(isInput, "isInput");

// ../engine/input/inputs.ts
var Inputs = class {
  static {
    __name(this, "Inputs");
  }
  #game;
  constructor(game) {
    this.#game = game;
  }
  // #region Actions
  #actions = /* @__PURE__ */ new Map();
  get actions() {
    return Object.freeze([...this.#actions.values()]);
  }
  get bindings() {
    return Object.freeze(
      [...this.#actions.values()].map((action) => [action, action.binding])
    );
  }
  get(action) {
    return this.#actions.get(action);
  }
  create(name, label, defaultBinding) {
    const cached = this.#actions.get(name);
    if (cached)
      return cached;
    const action = new Action(name, label, defaultBinding, this.#game);
    action.on(ActionBound, this.#onBind);
    this.#actions.set(name, action);
    this.fire(ActionCreated, action);
    return action;
  }
  remove(action) {
    const _action = typeof action === "string" ? this.#actions.get(action) : action;
    if (!_action) {
      throw new Error(`unknown action: ${action}`);
    }
    _action.unregister(ActionBound, this.#onBind);
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
  #screenCursor = void 0;
  get cursor() {
    const game = this.#game;
    return {
      screen: this.#screenCursor,
      get world() {
        if (!this.screen) {
          return void 0;
        }
        const camera = Camera.getActive(game);
        if (!camera) {
          return void 0;
        }
        return camera.screenToWorld(this.screen);
      }
    };
  }
  // #endregion
  // #region Event Handlers
  // #region Keyboard
  #onKeyDown = (ev) => this.#onKey(ev, true);
  #onKeyUp = (ev) => this.#onKey(ev, false);
  #onKey = (ev, pressed) => {
    if (ev.repeat)
      return;
    const input = ev.code;
    if (!isInput(input))
      return;
    const tick = this.#game.time.ticks;
    for (const action of this.actions.values()) {
      if (action.binding !== input)
        continue;
      action[actionSetHeld](pressed, tick);
    }
  };
  // #endregion
  // #region Mouse
  #onMouseDown = (ev) => this.#onMouse(ev, true);
  #onMouseUp = (ev) => this.#onMouse(ev, false);
  #onMouse = (ev, pressed) => {
    if (ev.target !== this.#game.renderer.app.canvas) {
      return;
    }
    const input = ev.button === 0 ? "MouseLeft" : ev.button === 1 ? "MouseMiddle" : ev.button === 2 ? "MouseRight" : void 0;
    if (!input)
      return;
    const button = input === "MouseLeft" ? "left" : input === "MouseMiddle" ? "middle" : "right";
    const cursor = this.cursor;
    if (pressed) {
      if (cursor.screen && cursor.world) {
        this.fire(MouseDown, button, { screen: cursor.screen, world: cursor.world });
        if (button === "left")
          this.fire(Click, { screen: cursor.screen, world: cursor.world });
      }
    } else {
      this.fire(MouseUp, button, cursor);
    }
    const tick = this.#game.time.ticks;
    for (const action of this.actions.values()) {
      if (action.binding !== input)
        continue;
      action[actionSetHeld](pressed, tick);
    }
  };
  #onMouseOver = (ev) => {
    if (this.#screenCursor === void 0) {
      this.#screenCursor = new Vector2(ev.offsetX, ev.offsetX);
    } else {
      this.#screenCursor.x = ev.offsetX;
      this.#screenCursor.y = ev.offsetY;
    }
  };
  #onMouseOut = (_) => {
    this.#screenCursor = void 0;
  };
  #onMouseMove = (ev) => {
    if (this.#screenCursor === void 0) {
      this.#screenCursor = new Vector2(ev.offsetX, ev.offsetX);
    } else {
      this.#screenCursor.x = ev.offsetX;
      this.#screenCursor.y = ev.offsetY;
    }
  };
  #onWheel = (ev) => {
    const scale = Camera.METERS_TO_PIXELS;
    this.fire(Scroll, new Vector2({ x: ev.deltaX / scale, y: ev.deltaY / scale }));
  };
  // #endregion
  #onBind = (ev) => {
    this.fire(ActionBound, ev.action, ev.input);
  };
  #onVisibilityChange = () => {
    if (document.visibilityState === "hidden")
      this.#clearActions();
  };
  #onContextMenu = (ev) => {
    ev.preventDefault();
  };
  [inputsRegisterHandlers]() {
    if (!this.#game.isClient()) {
      throw new Error("registerHandlers() can only be called on the client");
    }
    globalThis.addEventListener("keydown", this.#onKeyDown);
    globalThis.addEventListener("keyup", this.#onKeyUp);
    globalThis.addEventListener("mousedown", this.#onMouseDown);
    globalThis.addEventListener("mouseup", this.#onMouseUp);
    globalThis.addEventListener("wheel", this.#onWheel);
    globalThis.addEventListener("blur", this.#clearActions);
    document.addEventListener("visibilitychange", this.#onVisibilityChange);
    const canvas = this.#game.renderer.app.canvas;
    canvas.addEventListener("contextmenu", this.#onContextMenu);
    canvas.addEventListener("mouseover", this.#onMouseOver);
    canvas.addEventListener("mouseout", this.#onMouseOut);
    canvas.addEventListener("mousemove", this.#onMouseMove);
    return () => {
      globalThis.removeEventListener("keydown", this.#onKeyDown);
      globalThis.removeEventListener("keyup", this.#onKeyUp);
      globalThis.removeEventListener("mousedown", this.#onMouseDown);
      globalThis.removeEventListener("mouseup", this.#onMouseUp);
      globalThis.removeEventListener("wheel", this.#onWheel);
      globalThis.removeEventListener("blur", this.#clearActions);
      document.removeEventListener("visibilitychange", this.#onVisibilityChange);
      canvas.removeEventListener("contextmenu", this.#onContextMenu);
      canvas.removeEventListener("mouseover", this.#onMouseOver);
      canvas.removeEventListener("mouseout", this.#onMouseOut);
      canvas.removeEventListener("mousemove", this.#onMouseMove);
    };
  }
  // #endregion
  // #region Signals
  #signalListenerMap = /* @__PURE__ */ new Map();
  fire(ctor, ...args) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners)
      return;
    const signal = new ctor(...args);
    listeners.forEach((l) => l(signal));
  }
  on(type, listener) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener);
    this.#signalListenerMap.set(type, listeners);
  }
  unregister(type, listener) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners)
      return;
    const idx = listeners.indexOf(listener);
    if (idx !== -1)
      listeners.splice(idx, 1);
  }
  // #endregion
};

// ../engine/signals/actions.ts
var ActionCreated = class {
  constructor(action) {
    this.action = action;
  }
  static {
    __name(this, "ActionCreated");
  }
  [exclusiveSignalType] = Inputs;
};
var ActionDeleted = class {
  constructor(action) {
    this.action = action;
  }
  static {
    __name(this, "ActionDeleted");
  }
  [exclusiveSignalType] = Inputs;
};
var ActionBound = class {
  constructor(action, input) {
    this.action = action;
    this.input = input;
  }
  static {
    __name(this, "ActionBound");
  }
  [exclusiveSignalType] = Action;
};
var ActionPressed = class {
  static {
    __name(this, "ActionPressed");
  }
  [exclusiveSignalType] = Action;
};
var ActionReleased = class {
  static {
    __name(this, "ActionReleased");
  }
  [exclusiveSignalType] = Action;
};
var ActionChanged = class {
  constructor(value) {
    this.value = value;
  }
  static {
    __name(this, "ActionChanged");
  }
  [exclusiveSignalType] = Action;
};

// ../engine/signals/camera.ts
var ActiveCameraChanged = class {
  constructor(camera, previous) {
    this.camera = camera;
    this.previous = previous;
  }
  static {
    __name(this, "ActiveCameraChanged");
  }
};

// ../engine/signals/entity-collision.ts
var EntityCollision = class {
  constructor(started, other) {
    this.started = started;
    this.other = other;
  }
  static {
    __name(this, "EntityCollision");
  }
  [exclusiveSignalType] = Entity;
};

// ../engine/signals/entity-lifecycle.ts
var EntitySpawned = class {
  static {
    __name(this, "EntitySpawned");
  }
  [exclusiveSignalType] = Entity;
};
var EntityChildSpawned = class {
  constructor(child) {
    this.child = child;
  }
  static {
    __name(this, "EntityChildSpawned");
  }
  [exclusiveSignalType] = Entity;
};
var EntityDescendantSpawned = class {
  constructor(descendant) {
    this.descendant = descendant;
  }
  static {
    __name(this, "EntityDescendantSpawned");
  }
  [exclusiveSignalType] = Entity;
};
var EntityDestroyed = class {
  static {
    __name(this, "EntityDestroyed");
  }
  [exclusiveSignalType] = Entity;
};
var EntityChildDestroyed = class {
  constructor(child) {
    this.child = child;
  }
  static {
    __name(this, "EntityChildDestroyed");
  }
  [exclusiveSignalType] = Entity;
};
var EntityDescendantDestroyed = class {
  constructor(descendant) {
    this.descendant = descendant;
  }
  static {
    __name(this, "EntityDescendantDestroyed");
  }
  [exclusiveSignalType] = Entity;
};
var EntityRenamed = class {
  constructor(oldName) {
    this.oldName = oldName;
  }
  static {
    __name(this, "EntityRenamed");
  }
  [exclusiveSignalType] = Entity;
};
var EntityChildRenamed = class {
  constructor(child, oldName) {
    this.child = child;
    this.oldName = oldName;
  }
  static {
    __name(this, "EntityChildRenamed");
  }
  [exclusiveSignalType] = Entity;
};
var EntityDescendantRenamed = class {
  constructor(descendant, oldName) {
    this.descendant = descendant;
    this.oldName = oldName;
  }
  static {
    __name(this, "EntityDescendantRenamed");
  }
  [exclusiveSignalType] = Entity;
};
var EntityReparented = class {
  constructor(oldParent) {
    this.oldParent = oldParent;
  }
  static {
    __name(this, "EntityReparented");
  }
  [exclusiveSignalType] = Entity;
};
var EntityChildReparented = class {
  constructor(child, oldParent) {
    this.child = child;
    this.oldParent = oldParent;
  }
  static {
    __name(this, "EntityChildReparented");
  }
  [exclusiveSignalType] = Entity;
};
var EntityDescendantReparented = class {
  constructor(descendant, oldParent) {
    this.descendant = descendant;
    this.oldParent = oldParent;
  }
  static {
    __name(this, "EntityDescendantReparented");
  }
  [exclusiveSignalType] = Entity;
};

// ../engine/game.ts
import { initRapier } from "@dreamlab/vendor/rapier.js";

// ../engine/behavior/behavior-loader.ts
var BehaviorLoader = class {
  static {
    __name(this, "BehaviorLoader");
  }
  #game;
  #cache = /* @__PURE__ */ new Map();
  #initializedBehaviors = /* @__PURE__ */ new Set();
  #resourceLocationLookup = /* @__PURE__ */ new Map();
  constructor(game) {
    this.#game = game;
  }
  initialize(behaviorType) {
    if (this.#initializedBehaviors.has(behaviorType))
      return;
    this.#initializedBehaviors.add(behaviorType);
    if (behaviorType.onLoaded)
      behaviorType.onLoaded(this.#game);
  }
  lookup(type) {
    return this.#resourceLocationLookup.get(type);
  }
  registerInternalBehavior(type, namespace) {
    const uri = `builtin:${namespace}/${type.name}`;
    this.#resourceLocationLookup.set(type, uri);
    this.#cache.set(uri, type);
  }
  registerBehavior(type, resourceUri) {
    this.#resourceLocationLookup.set(type, resourceUri);
    this.#cache.set(resourceUri, type);
  }
  renameBehavior(type, newUri) {
    const oldUri = this.lookup(type);
    if (oldUri === void 0)
      throw new Error("Could not find old resource location for Behavior type: " + type.name);
    this.#cache.delete(oldUri);
    this.#resourceLocationLookup.set(type, newUri);
    this.#cache.set(newUri, type);
  }
  async loadScript(script) {
    const location = this.#game.resolveResource(script);
    const cachedConstructor = this.#cache.get(location);
    if (cachedConstructor !== void 0)
      return cachedConstructor;
    const module = await import(location);
    if (!("default" in module))
      throw new Error(`Module '${location}' must have a Behavior as its default export!`);
    const behaviorType = module.default;
    if (!(behaviorType instanceof Function && Object.prototype.isPrototypeOf.call(Behavior, behaviorType)))
      throw new Error(`Module '${location}' must have a Behavior as its default export!`);
    this.#cache.set(location, behaviorType);
    this.#resourceLocationLookup.set(behaviorType, script);
    return behaviorType;
  }
};

// ../engine/physics.ts
import RAPIER from "@dreamlab/vendor/rapier.js";
var PhysicsEngine = class {
  static {
    __name(this, "PhysicsEngine");
  }
  game;
  world;
  #events;
  tickDelta;
  // TODO: figure out how to network sync this
  enabled = true;
  constructor(game) {
    this.game = game;
    this.tickDelta = 1e3 / game.time.TPS;
    this.world = new RAPIER.World({ x: 0, y: -9.81 });
    this.world.integrationParameters.dt = 1 / game.time.TPS;
    this.#events = new RAPIER.EventQueue(true);
  }
  registerBody(entity, body) {
    const ud = (typeof body.userData === "object" ? body.userData : void 0) ?? {};
    body.userData = { ...ud, entityRef: entity.ref };
  }
  tick() {
    if (this.enabled)
      this.world.step(this.#events);
    this.#events.drainCollisionEvents((handle1, handle2, started) => {
      const body1 = this.world.bodies.get(handle1);
      const body2 = this.world.bodies.get(handle2);
      const udata1 = body1?.userData;
      const udata2 = body2?.userData;
      let entityRef1;
      let entityRef2;
      if (udata1 && typeof udata1 === "object" && "entityRef" in udata1) {
        entityRef1 = udata1.entityRef;
      }
      if (udata2 && typeof udata2 === "object" && "entityRef" in udata2) {
        entityRef2 = udata2.entityRef;
      }
      if (!entityRef1 || !entityRef2)
        return;
      const entity1 = this.game.entities.lookupByRef(entityRef1);
      const entity2 = this.game.entities.lookupByRef(entityRef2);
      if (!entity1 || !entity2)
        return;
      entity1.fire(EntityCollision, started, entity2);
      entity2.fire(EntityCollision, started, entity1);
    });
  }
  shutdown() {
    this.world.free();
    this.#events.free();
  }
};

// ../engine/renderer/renderer.ts
import * as PIXI from "@dreamlab/vendor/pixi.js";
var GameRenderer = class {
  static {
    __name(this, "GameRenderer");
  }
  #game;
  app;
  scene;
  #initialized = false;
  constructor(game) {
    this.#game = game;
    this.app = new PIXI.Application();
    this.scene = new PIXI.Container();
    this.app.stage.addChild(this.scene);
  }
  async initialize() {
    if (this.#initialized)
      return;
    this.#initialized = true;
    await this.app.init({
      autoDensity: true,
      resizeTo: this.#game.container,
      antialias: true,
      autoStart: false,
      sharedTicker: false
    });
    this.#game.container.append(this.app.canvas);
  }
  renderFrame() {
    this.app.ticker.update(this.#game.time.now);
    this.app.render();
  }
};

// ../engine/time.ts
var Time = class {
  static {
    __name(this, "Time");
  }
  #game;
  TPS = 60;
  constructor(game) {
    this.#game = game;
  }
  #accessMode = "tick";
  [timeSetMode](mode) {
    this.#accessMode = mode;
  }
  #ticks = 0;
  [timeTick]() {
    this.#ticks += 1;
  }
  get ticks() {
    return this.#ticks;
  }
  #now = 0;
  #delta = 0;
  #partial = 0;
  [timeIncrement](delta, partial) {
    this.#now += delta;
    this.#delta = delta;
    if (!this.#game.paused)
      this.#partial = partial;
  }
  get now() {
    if (this.#accessMode === "tick")
      return this.#ticks * this.#game.physics.tickDelta;
    return this.#now;
  }
  get delta() {
    if (this.#accessMode === "tick")
      return this.#game.physics.tickDelta;
    return this.#delta;
  }
  get partial() {
    if (this.#accessMode === "tick")
      return 0;
    return this.#partial;
  }
  toJSON() {
    return { now: this.now, delta: this.delta, partial: this.partial };
  }
};

// ../engine/ui.ts
var UIManager = class {
  static {
    __name(this, "UIManager");
  }
  #game;
  #container;
  constructor(game) {
    this.#game = game;
  }
  [uiInit]() {
    if (this.#container)
      return;
    this.#game.container.style.position = "relative";
    this.#container = document.createElement("div");
    this.#container.style.pointerEvents = "none";
    this.#container.style.position = "absolute";
    this.#container.style.inset = "0";
    this.#container.style.overflow = "hidden";
    this.#game.container.appendChild(this.#container);
  }
  [uiDestroy]() {
    this.#container?.remove();
    this.#container = void 0;
  }
  create(entity) {
    if (!this.#container) {
      throw new Error("game not initialized");
    }
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.inset = "0";
    const root = div.attachShadow({ mode: "open" });
    this.#container.appendChild(div);
    div.id = entity.id;
    entity.on(EntityReparented, () => div.id = entity.id);
    return [div, root];
  }
};
function element(tag, {
  id,
  props = {},
  style = {},
  classList = [],
  children = []
} = {}) {
  const element2 = document.createElement(tag);
  if (id)
    element2.id = id;
  for (const cl of classList)
    element2.classList.add(cl);
  Object.assign(element2.style, style);
  Object.assign(element2, props);
  const nodes = children.map((e) => typeof e === "string" ? document.createTextNode(e) : e);
  element2.append(...nodes);
  return element2;
}
__name(element, "element");

// ../engine/value/data.ts
var ValueTypeAdapter = class {
  constructor(game) {
    this.game = game;
  }
  static {
    __name(this, "ValueTypeAdapter");
  }
};

// ../engine/value/registry.ts
var ValueChanged = class {
  constructor(value, newValue, clock, from) {
    this.value = value;
    this.newValue = newValue;
    this.clock = clock;
    this.from = from;
  }
  static {
    __name(this, "ValueChanged");
  }
  [exclusiveSignalType] = ValueRegistry;
};
var ValueRegistry = class extends BasicSignalHandler {
  static {
    __name(this, "ValueRegistry");
  }
  #values = /* @__PURE__ */ new Map();
  #source = "server";
  get source() {
    return this.#source;
  }
  [setValueRegistrySource](value) {
    this.#source = value;
  }
  game;
  constructor(game) {
    super();
    this.game = game;
  }
  get values() {
    return [...this.#values.values()];
  }
  lookup(identifier) {
    return this.#values.get(identifier);
  }
  register(value) {
    if (this.#values.has(value.identifier))
      throw new Error(`Value with identifier '${value.identifier}' already exists!`);
    this.#values.set(value.identifier, value);
  }
  remove(value) {
    this.#values.delete(value.identifier);
  }
};

// ../engine/value/value.ts
function inferValueTypeTag(value) {
  switch (typeof value) {
    case "number":
      return Number;
    case "string":
      return String;
    case "boolean":
      return Boolean;
  }
  throw new Error(`Failed to infer type tag for value: ${value}`);
}
__name(inferValueTypeTag, "inferValueTypeTag");
var Value = class {
  static {
    __name(this, "Value");
  }
  #registry;
  identifier;
  #value;
  typeTag;
  adapter;
  /** for conflict resolution: incrementing number (greater number wins) */
  clock;
  /** for conflict resolution: the last setting client's connection ID, or "server" if set by the server. */
  #lastSource = "server";
  get value() {
    return this.#value;
  }
  set value(newValue) {
    this.#registry.fire(
      ValueChanged,
      this,
      newValue,
      this.clock + 1,
      this.#registry.source
    );
  }
  description;
  replicated = true;
  constructor(registry, identifier, defaultValue, typeTag, description) {
    this.#registry = registry;
    this.identifier = identifier;
    this.#value = defaultValue;
    this.typeTag = typeTag;
    this.clock = 0;
    this.#lastSource = registry.source;
    this.description = description;
    if (this.typeTag !== Number && this.typeTag !== String && this.typeTag !== Boolean) {
      const adapterTypeTag = this.typeTag;
      this.adapter = new adapterTypeTag(registry.game);
      if (!(this.adapter instanceof ValueTypeAdapter))
        throw new Error("AdapterTypeTag was not the correct type!");
    }
    this.#registry.on(ValueChanged, this.#changeListener);
    this.#registry.register(this);
  }
  destroy() {
    this.#registry.unregister(ValueChanged, this.#changeListener);
    this.#registry.remove(this);
  }
  [Symbol.dispose]() {
    this.destroy();
  }
  #changeListener = (signal) => {
    if (signal.value === this)
      this.#applyUpdate(signal.newValue, signal.clock, signal.from);
  };
  #applyUpdate(incomingValue, incomingClock, incomingSource) {
    if (incomingClock < this.clock)
      return;
    if (incomingClock === this.clock) {
      if (incomingSource !== "server") {
        if (this.#lastSource === "server")
          return;
        if (incomingSource < this.#lastSource)
          return;
      }
    }
    this.#value = incomingValue;
    this.#lastSource = incomingSource;
    this.clock = incomingClock;
  }
};

// ../engine/value/adapters/entity-by-ref-adapter.ts
var EntityByRefAdapter = class extends ValueTypeAdapter {
  static {
    __name(this, "EntityByRefAdapter");
  }
  convertToPrimitive(value) {
    return value?.ref;
  }
  convertFromPrimitive(value) {
    if (value === void 0)
      return void 0;
    if (typeof value !== "string")
      throw new TypeError("An EntityByRef value should be a string!");
    const ref = value;
    return this.game.entities.lookupByRef(ref);
  }
};

// ../engine/value/adapters/enum-adapter.ts
function enumAdapter(values) {
  function isValid(v) {
    if (typeof v !== "string")
      return false;
    return values.includes(v);
  }
  __name(isValid, "isValid");
  return class EnumAdapter extends ValueTypeAdapter {
    static {
      __name(this, "EnumAdapter");
    }
    convertToPrimitive(value) {
      if (!isValid(value)) {
        throw new TypeError("invalid enum member");
      }
      return value;
    }
    convertFromPrimitive(value) {
      if (!isValid(value)) {
        throw new TypeError("invalid enum member");
      }
      return value;
    }
  };
}
__name(enumAdapter, "enumAdapter");

// ../engine/value/adapters/texture-adapter.ts
var TextureAdapter = class extends ValueTypeAdapter {
  static {
    __name(this, "TextureAdapter");
  }
  convertToPrimitive(value) {
    return value;
  }
  convertFromPrimitive(value) {
    if (typeof value !== "string")
      throw new TypeError("A Texture value should be a string!");
    return value;
  }
};
var SpritesheetAdapter = class extends ValueTypeAdapter {
  static {
    __name(this, "SpritesheetAdapter");
  }
  convertToPrimitive(value) {
    return value;
  }
  convertFromPrimitive(value) {
    if (typeof value !== "string")
      throw new TypeError("A Spritesheet value should be a string!");
    return value;
  }
};

// ../engine/value/adapters/vector-adapter.ts
var Vector2Adapter = class extends ValueTypeAdapter {
  static {
    __name(this, "Vector2Adapter");
  }
  convertToPrimitive(value) {
    return { x: value.x, y: value.y };
  }
  convertFromPrimitive(value) {
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError("A Vector2 value should be an object");
    }
    if (!("x" in value && "y" in value) || typeof value.x !== "number" || typeof value.y !== "number") {
      throw new TypeError("Invalid Vector2 value");
    }
    return new Vector2({ x: value.x, y: value.y });
  }
};

// ../engine/game.ts
var GameStatus = /* @__PURE__ */ ((GameStatus2) => {
  GameStatus2[GameStatus2["Loading"] = 0] = "Loading";
  GameStatus2[GameStatus2["Running"] = 1] = "Running";
  GameStatus2[GameStatus2["Shutdown"] = 2] = "Shutdown";
  return GameStatus2;
})(GameStatus || {});
var BaseGame = class {
  static {
    __name(this, "BaseGame");
  }
  instanceId;
  worldId;
  paused = false;
  constructor(opts) {
    if (!(this instanceof ServerGame || this instanceof ClientGame))
      throw new Error("BaseGame is sealed to ServerGame and ClientGame!");
    this.instanceId = opts.instanceId;
    this.worldId = opts.worldId;
  }
  values = new ValueRegistry(this);
  entities = new EntityStore();
  world = new WorldRoot(this);
  prefabs = new PrefabsRoot(this);
  time = new Time(this);
  inputs = new Inputs(this);
  [behaviorLoader] = new BehaviorLoader(this);
  loadBehavior(scriptUri) {
    return this[behaviorLoader].loadScript(scriptUri);
  }
  #initialized = false;
  #physics;
  get physics() {
    if (this.#physics)
      return this.#physics;
    throw new Error("physics are not yet initialized!");
  }
  #status = 0 /* Loading */;
  #statusDescription;
  get status() {
    return this.#status;
  }
  get statusDescription() {
    return this.#statusDescription;
  }
  setStatus(status, description) {
    this.#status = status;
    this.#statusDescription = description;
    this.fire(GameStatusChange);
  }
  worldScriptBaseURL = "";
  cloudAssetBaseURL = "https://s3-assets.dreamlab.gg/";
  /** Resolves res:// and cloud:// URIs to https:// URLs */
  resolveResource(uri) {
    let url = new URL(uri);
    if (["res:", "cloud:", "s3:"].includes(url.protocol) && url.host || url.pathname.startsWith("//")) {
      url = new URL(url.href.replace(`${url.protocol}//`, `${url.protocol}`));
    }
    switch (url.protocol) {
      case "res:":
        return new URL(url.pathname, this.worldScriptBaseURL).toString();
      case "cloud:":
      case "s3:":
        return new URL(url.pathname, this.cloudAssetBaseURL).toString();
      default:
        return uri;
    }
  }
  /** Fetches a resource (supports res:// amd cloud:// URIs) */
  fetch(uri, init) {
    return fetch(this.resolveResource(uri), init);
  }
  // #region Lifecycle
  async initialize() {
    if (this.#initialized)
      return;
    this.#initialized = true;
    await initRapier();
    this.#physics = new PhysicsEngine(this);
  }
  tick() {
    if (!this.#initialized)
      throw new Error("Illegal state: Game was not initialized before tick loop began!");
    this.time[timeSetMode]("tick");
    this.time[timeTick]();
    this.fire(GamePreTick);
    this[preTickEntities]();
    if (!this.paused)
      this.physics.tick();
    this[tickEntities]();
    this.fire(GameTick);
    this.fire(GamePostTick);
  }
  [preTickEntities]() {
    this.world[preTickEntities]();
  }
  [tickEntities]() {
    this.world[tickEntities]();
  }
  [updateInterpolation]() {
    this.world[updateInterpolation]();
  }
  shutdown() {
    this.setStatus(2 /* Shutdown */);
    this.fire(GameShutdown);
    this.physics.shutdown();
  }
  [Symbol.dispose]() {
    this.shutdown();
  }
  // #endregion
  // #region SignalHandler impl
  #signalListenerMap = /* @__PURE__ */ new Map();
  fire(ctor, ...args) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners)
      return;
    const signal = new ctor(...args);
    listeners.forEach((l) => l(signal));
  }
  on(type, listener) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener);
    this.#signalListenerMap.set(type, listeners);
  }
  unregister(type, listener) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners)
      return;
    const idx = listeners.indexOf(listener);
    if (idx !== -1)
      listeners.splice(idx, 1);
  }
  // #endregion
};
var ServerGame = class extends BaseGame {
  static {
    __name(this, "ServerGame");
  }
  isClient = () => false;
  isServer = () => true;
  remote = new ServerRoot(this);
  local;
  drawFrame;
  network;
  constructor(opts) {
    super(opts);
    this.network = opts.network;
  }
  [preTickEntities]() {
    super[preTickEntities]();
    this.remote[preTickEntities]();
  }
  [tickEntities]() {
    super[tickEntities]();
    this.remote[tickEntities]();
  }
  [updateInterpolation]() {
  }
};
var ClientGame = class extends BaseGame {
  static {
    __name(this, "ClientGame");
  }
  isClient = () => true;
  isServer = () => false;
  container;
  renderer;
  ui = new UIManager(this);
  network;
  constructor(opts) {
    super(opts);
    this.container = opts.container;
    this.renderer = new GameRenderer(this);
    this.network = opts.network;
    this.values[setValueRegistrySource](this.network.self);
  }
  async initialize() {
    await super.initialize();
    await this.renderer.initialize();
    this.inputs[inputsRegisterHandlers]();
    this.ui[uiInit]();
  }
  shutdown() {
    this.ui[uiDestroy]();
    super.shutdown();
  }
  local = new LocalRoot(this);
  remote;
  #tickAccumulator = 0;
  tickClient(delta) {
    this.#tickAccumulator += delta;
    while (this.#tickAccumulator >= this.physics.tickDelta) {
      if (this.#tickAccumulator > 5e3) {
        this.#tickAccumulator = 0;
        console.warn("Skipped a bunch of ticks (tick accumulator ran over 5 seconds!)");
        break;
      }
      this.#tickAccumulator -= this.physics.tickDelta;
      this.tick();
    }
    this.time[timeSetMode]("render");
    this.time[timeIncrement](delta, this.#tickAccumulator / this.physics.tickDelta);
    this[updateInterpolation]();
    this.fire(GameRender);
    this.renderer.renderFrame();
    this.fire(GamePostRender);
  }
  [preTickEntities]() {
    super[preTickEntities]();
    this.local[preTickEntities]();
  }
  [tickEntities]() {
    super[tickEntities]();
    this.local[tickEntities]();
  }
  [updateInterpolation]() {
    super[updateInterpolation]();
    this.local[updateInterpolation]();
  }
};

// ../engine/signals/game-events.ts
var GamePreTick = class {
  static {
    __name(this, "GamePreTick");
  }
  [exclusiveSignalType] = BaseGame;
};
var GameTick = class {
  static {
    __name(this, "GameTick");
  }
  [exclusiveSignalType] = BaseGame;
};
var GamePostTick = class {
  static {
    __name(this, "GamePostTick");
  }
  [exclusiveSignalType] = BaseGame;
};
var GamePreRender = class {
  static {
    __name(this, "GamePreRender");
  }
  [exclusiveSignalType] = BaseGame;
};
var GameRender = class {
  static {
    __name(this, "GameRender");
  }
  [exclusiveSignalType] = BaseGame;
};
var GamePostRender = class {
  static {
    __name(this, "GamePostRender");
  }
  [exclusiveSignalType] = BaseGame;
};
var GameShutdown = class {
  static {
    __name(this, "GameShutdown");
  }
  [exclusiveSignalType] = BaseGame;
};
var GameStatusChange = class {
  static {
    __name(this, "GameStatusChange");
  }
  [exclusiveSignalType] = BaseGame;
};

// ../engine/signals/mouse.ts
var Click = class {
  constructor(cursor) {
    this.cursor = cursor;
  }
  static {
    __name(this, "Click");
  }
};
var MouseDown = class {
  constructor(button, cursor) {
    this.button = button;
    this.cursor = cursor;
  }
  static {
    __name(this, "MouseDown");
  }
};
var MouseUp = class {
  constructor(button, cursor) {
    this.button = button;
    this.cursor = cursor;
  }
  static {
    __name(this, "MouseUp");
  }
};
var MouseOver = class {
  constructor(cursor) {
    this.cursor = cursor;
  }
  static {
    __name(this, "MouseOver");
  }
};
var MouseOut = class {
  constructor(cursor) {
    this.cursor = cursor;
  }
  static {
    __name(this, "MouseOut");
  }
};
var Scroll = class {
  constructor(delta) {
    this.delta = delta;
  }
  static {
    __name(this, "Scroll");
  }
};

// ../engine/signals/multiplayer.ts
var PlayerJoined = class {
  constructor(connection) {
    this.connection = connection;
  }
  static {
    __name(this, "PlayerJoined");
  }
};
var PlayerLeft = class {
  constructor(connection) {
    this.connection = connection;
  }
  static {
    __name(this, "PlayerLeft");
  }
};

// ../engine/entity/entity.ts
var Entity = class _Entity {
  static {
    __name(this, "Entity");
  }
  static icon;
  disabled = false;
  game;
  get time() {
    return this.game.time;
  }
  get inputs() {
    return this.game.inputs;
  }
  // #region Name / ID / Hierarchy
  #name;
  get name() {
    return this.#name;
  }
  set name(name) {
    const oldName = this.#name;
    this.#name = name;
    const parent = this.parent;
    if (parent) {
      parent.removeChild(this, oldName);
      parent.append(this);
    }
    this.#recomputeId();
    this.fire(EntityRenamed, oldName);
    if (this.parent) {
      this.parent.fire(EntityChildRenamed, this, oldName);
    }
    let ancestor = this.parent;
    while (ancestor) {
      ancestor.fire(EntityDescendantRenamed, this, oldName);
      ancestor = ancestor.parent;
    }
  }
  id;
  root;
  #parent;
  get parent() {
    return this.#parent;
  }
  set parent(parent) {
    if (parent) {
      parent.append(this);
      this.#recomputeId();
      this.#updateTransform(true);
    } else if (this.parent) {
      this.destroy();
    }
  }
  #children = /* @__PURE__ */ new Map();
  get children() {
    return this.#children;
  }
  append(child) {
    let nonConflictingName;
    if (this.#children.has(child.name))
      nonConflictingName = this.#findNonConflictingName(child);
    const oldParent = child.#parent;
    if (oldParent) {
      const oldChildren = oldParent.#children;
      oldChildren.delete(child.#name);
    }
    this.#children.set(nonConflictingName ?? child.name, child);
    child.#parent = this;
    if (oldParent) {
      child.fire(EntityReparented, oldParent);
      this.fire(EntityChildReparented, child, oldParent);
      let ancestor = this;
      while (ancestor) {
        ancestor.fire(EntityDescendantReparented, child, oldParent);
        ancestor = ancestor.parent;
      }
    }
    if (nonConflictingName) {
      const oldName = child.#name;
      child.#name = nonConflictingName;
      child.#recomputeId();
      child.fire(EntityRenamed, oldName);
    }
  }
  removeChild(child, name) {
    if (child.parent !== this)
      return;
    this.#children.delete(name ?? child.name);
    child.#parent = void 0;
  }
  #findNonConflictingName(child) {
    const matches = child.name.match(/(?<base>.*)\.(?<n>\d+)/)?.groups;
    const baseName = matches?.base ?? child.name;
    for (let n = matches?.n ? +matches.n : 1; n <= 999; n++) {
      const suffix = n;
      const potentialName = baseName + "." + suffix;
      if (!this.#children.has(potentialName)) {
        return potentialName;
      }
    }
    let left = 1e3;
    let right = Number.MAX_SAFE_INTEGER;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const potentialName = baseName + "." + mid;
      if (!this.#children.has(potentialName)) {
        if (mid === 1e3 || this.#children.has(baseName + "." + (mid - 1))) {
          return potentialName;
        }
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    throw new Error("Could not find free unique name for entity! This should never happen.");
  }
  // tracks how deeply nested we are in the tree.
  // since updates are recursive games should not let this get too high
  #hierarchyGeneration = 0;
  /**
   * Utility for looking up child entities
   */
  _ = new Proxy(Object.freeze({}), {
    get: (_target, prop) => {
      if (typeof prop !== "string")
        return _target[prop];
      const entity = this.#children.get(prop);
      if (!entity)
        throw new Error(`${serializeIdentifier(this.id, prop)} does not exist!`);
      return entity;
    },
    set: (_target, _prop) => {
      throw new Error("EntityGet is not mutable!");
    }
  });
  /**
   * Utility for safely hardcasting an entity to a type
   */
  cast(type) {
    if (this instanceof type)
      return this;
    throw new Error(`Failed to cast ${this} to '${type.name}'`);
  }
  #recomputeId() {
    const oldId = this.id;
    this.id = serializeIdentifier(this.#parent?.id, this.#name);
    for (const child of this.children.values())
      child.#recomputeId();
    this.game.entities[entityStoreRegister](this, oldId);
    this.#hierarchyGeneration = this.parent ? this.parent.#hierarchyGeneration + 1 : 0;
    if (this.#hierarchyGeneration > 255)
      console.warn(`${this.id} is very deeply nested!! You may run into issues.`);
  }
  // deno-lint-ignore no-explicit-any
  [entitySpawn](def, opts = {}) {
    const entity = new def.type({
      game: this.game,
      name: def.name,
      parent: this,
      transform: def.transform,
      authority: def.authority,
      ref: def._ref,
      values: def.values ? Object.fromEntries(Object.entries(def.values)) : void 0
    });
    if (def.behaviors) {
      def.behaviors.forEach((b) => {
        const behavior = new b.type({
          game: this.game,
          entity,
          ref: b._ref,
          values: b.values
        });
        entity.behaviors.push(behavior);
      });
    }
    def.children?.forEach((c) => {
      try {
        entity[entitySpawn](c, opts);
      } catch (err) {
        console.error(err);
      }
    });
    if (!opts.inert)
      entity.#spawn();
    return entity;
  }
  /**
   * Spawns an Entity as a child of `this`. The entity definition can contain extra behaviors and
   * children to attach to the spawned entity. Parents are initialized before children.
   */
  // deno-lint-ignore no-explicit-any
  spawn(def) {
    return this[entitySpawn](def);
  }
  [entitySpawnFinalize]() {
    for (const child of this.children.values())
      child[entitySpawnFinalize]();
    this.#spawn();
  }
  // #endregion
  // #region Behaviors
  behaviors = [];
  addBehavior(behavior) {
    const b = new behavior.type({
      game: this.game,
      entity: this,
      ref: behavior._ref,
      // @ts-expect-error: generic constraints
      values: behavior.values
    });
    this.behaviors.push(b);
    const behaviorType = behavior.constructor;
    this.game[behaviorLoader].initialize(behaviorType);
    b.spawn();
    return b;
  }
  getBehavior(constructor) {
    const behavior = this.behaviors.find((b) => b instanceof constructor);
    if (!behavior) {
      throw new Error(`No behaviors with type: ${constructor.name}`);
    }
    return behavior;
  }
  getBehaviors(constructor) {
    return this.behaviors.filter((b) => b instanceof constructor);
  }
  // #endregion
  // #region Cloning
  #generatePlainDefinition(withRefs) {
    const entityValues = {};
    for (const [key, value] of this.values.entries()) {
      const newValue = value.adapter ? value.adapter.convertFromPrimitive(value.adapter.convertToPrimitive(value.value)) : structuredClone(value.value);
      entityValues[key] = newValue;
    }
    return {
      _ref: withRefs ? this.ref : void 0,
      name: this.name,
      type: this.constructor,
      typeName: _Entity.getTypeName(this.constructor),
      authority: this.authority,
      transform: {
        position: this.transform.position.bare(),
        rotation: this.transform.rotation,
        scale: this.transform.scale.bare(),
        z: this.transform.z
      },
      values: entityValues
    };
  }
  #generateBehaviorDefinition(behavior, withRefs) {
    const behaviorValues = {};
    for (const [key, value] of behavior.values.entries()) {
      const newValue = value.adapter ? value.adapter.convertFromPrimitive(value.adapter.convertToPrimitive(value.value)) : structuredClone(value.value);
      behaviorValues[key] = newValue;
    }
    const uri = this.game[behaviorLoader].lookup(
      behavior.constructor
    );
    if (!uri)
      throw new Error("Attempted to serialize behavior with no associated uri");
    return {
      _ref: withRefs ? behavior.ref : void 0,
      type: behavior.constructor,
      values: behaviorValues,
      uri
    };
  }
  #generateRichDefinition(withRefs) {
    const definition = this.#generatePlainDefinition(withRefs);
    definition.behaviors = this.behaviors.length === 0 ? void 0 : this.behaviors.map((b) => this.#generateBehaviorDefinition(b, withRefs));
    definition.children = this.children.size === 0 ? void 0 : [...this.children.values()].map((entity) => entity.#generateRichDefinition(withRefs));
    return definition;
  }
  getDefinition() {
    return this.#generateRichDefinition(true);
  }
  cloneInto(other, overrides = {}) {
    return other.spawn({ ...this.#generateRichDefinition(false), ...overrides });
  }
  // #endregion
  // #region Transform
  transform;
  globalTransform;
  get pos() {
    return this.globalTransform.position;
  }
  set pos(value) {
    this.globalTransform.position = value;
  }
  get z() {
    return this.globalTransform.z;
  }
  set z(value) {
    this.globalTransform.z = value;
  }
  #prevPosition;
  #prevRotation;
  #prevScale;
  #interpolated;
  get interpolated() {
    return this.#interpolated;
  }
  setTransform(opts) {
    if (opts.position?.x) {
      this.transform.position.x = opts.position.x;
      this.#prevPosition.x = opts.position.x;
    }
    if (opts.position?.y) {
      this.transform.position.y = opts.position.y;
      this.#prevPosition.y = opts.position.y;
    }
    if (opts.rotation) {
      this.transform.rotation = opts.rotation;
      this.#prevRotation = opts.rotation;
    }
    if (opts.scale?.x) {
      this.transform.scale.x = opts.scale.x;
      this.#prevScale.x = opts.scale.x;
    }
    if (opts.scale?.y) {
      this.transform.scale.y = opts.scale.y;
      this.#prevScale.y = opts.scale.y;
    }
    if (opts.z)
      this.transform.z = opts.z;
  }
  setGlobalTransform(opts) {
    if (opts.position?.x) {
      this.globalTransform.position.x = opts.position.x;
      this.#prevPosition.x = opts.position.x;
    }
    if (opts.position?.y) {
      this.globalTransform.position.y = opts.position.y;
      this.#prevPosition.y = opts.position.y;
    }
    if (opts.rotation) {
      this.globalTransform.rotation = opts.rotation;
      this.#prevRotation = opts.rotation;
    }
    if (opts.scale?.x) {
      this.globalTransform.scale.x = opts.scale.x;
      this.#prevScale.x = opts.scale.x;
    }
    if (opts.scale?.y) {
      this.globalTransform.scale.y = opts.scale.y;
      this.#prevScale.y = opts.scale.y;
    }
    if (opts.z)
      this.globalTransform.z = opts.z;
  }
  // #endregion
  // #region Values
  #defaultValues = {};
  #values = /* @__PURE__ */ new Map();
  get values() {
    return this.#values;
  }
  defineValues(eType, ...props) {
    for (const prop of props) {
      this.defineValue(eType, prop);
    }
  }
  defineValue(eType, prop, opts = {}) {
    if (!(this instanceof eType))
      throw new TypeError(`${this.constructor} is not an instance of ${eType}`);
    const identifier = `${this.ref}/${prop}`;
    if (this.#values.has(identifier))
      throw new Error(`A value with the identifier '${identifier}' already exists!`);
    let defaultValue = this[prop];
    if (this.#defaultValues[prop])
      defaultValue = this.#defaultValues[prop];
    const value = new Value(
      this.game.values,
      identifier,
      defaultValue,
      opts.type ?? inferValueTypeTag(defaultValue),
      opts.description ?? prop
      // TODO: autogenerate description (fix casing & spacing)
    );
    if (opts.replicated)
      value.replicated = opts.replicated;
    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      set: (v) => {
        value.value = v;
      },
      get: () => value.value
    });
    this.#values.set(prop, value);
    return value;
  }
  // #endregion
  // #region Authority
  #exclusiveAuthority;
  #exclusiveAuthorityClock = 0;
  [entityForceAuthorityValues](authority, clock) {
    if (clock < this.#exclusiveAuthorityClock)
      return;
    if (clock === this.#exclusiveAuthorityClock && this.#exclusiveAuthority !== void 0 && (authority ?? "") < this.#exclusiveAuthority)
      return;
    this.#exclusiveAuthority = authority;
    this.#exclusiveAuthorityClock = clock;
  }
  get [entityAuthorityClock]() {
    return this.#exclusiveAuthorityClock;
  }
  get authority() {
    return this.#exclusiveAuthority;
  }
  set authority(newAuthority) {
    this.game.fire(
      EntityExclusiveAuthorityChanged,
      this,
      newAuthority,
      this.#exclusiveAuthorityClock + 1
    );
  }
  takeAuthority() {
    this.authority = this.game.network.self ?? "server";
  }
  // #endregion
  // internal id for stable internal reference. we only really need this for networking
  ref = generateCUID("ent");
  pausable = true;
  #updateTransform(fromGlobal) {
    if (!this.transform || !this.globalTransform)
      return;
    if (fromGlobal) {
      const parentTransform = this.parent?.globalTransform;
      const localSpaceTransform = parentTransform ? transformWorldToLocal(parentTransform, this.globalTransform) : this.globalTransform;
      this.transform[transformForceUpdate](localSpaceTransform);
    } else {
      const parentTransform = this.parent?.globalTransform;
      const worldSpaceTransform = parentTransform ? transformLocalToWorld(parentTransform, this.transform) : this.transform;
      this.globalTransform[transformForceUpdate](worldSpaceTransform);
    }
    this.fire(EntityTransformUpdate);
    for (const child of this.children.values()) {
      child.#updateTransform(false);
    }
  }
  constructor(ctx) {
    _Entity.#ensureEntityTypeIsRegistered(new.target);
    if (ctx.ref)
      this.ref = ctx.ref;
    this.game = ctx.game;
    this.root = ctx.parent?.root;
    this.#name = ctx.name;
    this.id = serializeIdentifier(ctx.parent?.id, this.#name);
    this.parent = ctx.parent;
    this.transform = new Transform(ctx.transform);
    this.globalTransform = new Transform();
    this.#exclusiveAuthority = ctx.authority;
    if (ctx.values)
      this.#defaultValues = ctx.values;
    this.transform[transformOnChanged] = () => {
      this.#updateTransform(false);
    };
    this.globalTransform[transformOnChanged] = () => {
      this.#updateTransform(true);
    };
    {
      const parentTransform = this.parent?.globalTransform;
      const worldSpaceTransform = parentTransform ? transformLocalToWorld(parentTransform, this.transform) : this.transform;
      this.globalTransform[transformForceUpdate](worldSpaceTransform);
    }
    this.#prevPosition = this.globalTransform.position.bare();
    this.#prevRotation = this.globalTransform.rotation;
    this.#prevScale = this.globalTransform.scale.bare();
    this.#interpolated = new Transform(this.globalTransform);
    this.game.entities[entityStoreRegister](this);
  }
  // #region Signals
  #signalListenerMap = /* @__PURE__ */ new Map();
  fire(ctor, ...args) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners)
      return;
    const signal = new ctor(...args);
    listeners.forEach((l) => l(signal));
  }
  on(type, listener) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener);
    this.#signalListenerMap.set(type, listeners);
  }
  unregister(type, listener) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners)
      return;
    const idx = listeners.indexOf(listener);
    if (idx !== -1)
      listeners.splice(idx, 1);
  }
  // #endregion
  // #region Listeners
  #listeners = [];
  listen(receiver, signalType, signalListener) {
    const boundSignalListener = signalListener.bind(this);
    if (receiver === this) {
      return this.on(signalType, signalListener);
    }
    receiver.on(signalType, boundSignalListener);
    this.#listeners.push([
      new WeakRef(receiver),
      signalType,
      boundSignalListener
    ]);
  }
  // #endregion
  // #region Lifecycle
  #spawned = false;
  #spawn() {
    this.#spawned = true;
    this.onInitialize();
    this.fire(EntitySpawned);
    this.parent?.fire(EntityChildSpawned, this);
    let ancestor = this.parent;
    while (ancestor) {
      ancestor.fire(EntityDescendantSpawned, this);
      ancestor = ancestor.parent;
    }
    for (const behavior of this.behaviors) {
      const behaviorType = behavior.constructor;
      this.game[behaviorLoader].initialize(behaviorType);
      behavior.spawn();
    }
  }
  onInitialize() {
  }
  #origPosition = new Vector2(NaN, NaN);
  #origScale = new Vector2(NaN, NaN);
  #origRotation = NaN;
  #origZ = NaN;
  [preTickEntities]() {
    if (this.pausable && this.game.paused)
      return;
    if (!this.#spawned)
      this.#spawn();
    this.#prevPosition = this.globalTransform.position.bare();
    this.#prevRotation = this.globalTransform.rotation;
    this.#prevScale = this.globalTransform.scale.bare();
    this.fire(EntityPreUpdate);
    const tr = this.globalTransform;
    this.#origPosition.x = tr.position.x;
    this.#origPosition.y = tr.position.y;
    this.#origScale.x = tr.scale.x;
    this.#origScale.y = tr.scale.y;
    this.#origRotation = tr.rotation;
    this.#origZ = tr.z;
    for (const child of this.#children.values()) {
      try {
        child[preTickEntities]();
      } catch (err) {
        console.error(err);
      }
    }
  }
  [tickEntities]() {
    if (this.pausable && this.game.paused)
      return;
    this.fire(EntityUpdate);
    const tr = this.globalTransform;
    if (!this.#origPosition.eq(tr.position))
      this.fire(EntityMove, this.#origPosition, tr.position);
    if (!this.#origScale.eq(tr.scale))
      this.fire(EntityResize, this.#origScale, tr.scale);
    if (this.#origRotation !== tr.rotation)
      this.fire(EntityRotate, this.#origRotation, tr.rotation);
    if (this.#origZ !== tr.z)
      this.fire(EntityZChanged, this.#origZ, tr.z);
    for (const child of this.#children.values()) {
      try {
        child[tickEntities]();
      } catch (err) {
        console.error(err);
      }
    }
  }
  [updateInterpolation]() {
    const partial = this.time.partial;
    this.#interpolated.position.assign(
      Vector2.lerp(this.#prevPosition, this.globalTransform.position, partial)
    );
    this.#interpolated.rotation = lerpAngle(
      this.#prevRotation,
      this.globalTransform.rotation,
      partial
    );
    this.#interpolated.scale.assign(
      Vector2.lerp(this.#prevScale, this.globalTransform.scale, partial)
    );
    for (const child of this.#children.values()) {
      try {
        child[updateInterpolation]();
      } catch (err) {
        console.error(err);
      }
    }
  }
  destroy() {
    this.fire(EntityDestroyed);
    if (this.parent) {
      this.parent.fire(EntityChildDestroyed, this);
      this.parent.#children.delete(this.name);
      let ancestor = this.parent;
      while (ancestor) {
        ancestor.fire(EntityDescendantDestroyed, this);
        ancestor = ancestor.parent;
      }
    }
    for (const child of this.#children.values()) {
      child.destroy();
    }
    for (const behavior of [...this.behaviors]) {
      behavior.destroy();
    }
    for (const [receiverRef, type, listener] of this.#listeners) {
      const receiver = receiverRef.deref();
      if (!receiver)
        continue;
      receiver.unregister(type, listener);
    }
    for (const value of this.#values.values())
      value.destroy();
    this.#parent = void 0;
    this.game.entities[entityStoreUnregister](this);
    this.#signalListenerMap.clear();
  }
  // #endregion
  set(values) {
    for (const [name, _val] of Object.entries(values)) {
      if (!(name in this)) {
        throw new Error("property name passed to Entity.set(..) does not exist!");
      }
      const value = this.values.get(name);
      if (!value) {
        throw new Error("property name passed to Entity.set(..) is not a SyncedValue!");
      }
      value.value = _val;
    }
  }
  [Symbol.for("Deno.customInspect")]() {
    return this.toString();
  }
  toString() {
    return `${this.id} (${this.constructor.name})`;
  }
  // #region Registry
  static #entityTypeRegistry = /* @__PURE__ */ new Map();
  static registerType(type, namespace) {
    this.#entityTypeRegistry.set(type, namespace);
  }
  static #ensureEntityTypeIsRegistered = (newTarget) => {
    const target = newTarget;
    if (!_Entity.#entityTypeRegistry.has(target) && !Reflect.get(target, internalEntity)) {
      throw new Error(`Entity type registry is missing ${target.name}!`);
    }
  };
  static getTypeName(type) {
    const namespace = this.#entityTypeRegistry.get(type);
    if (!namespace)
      throw new Error(`Entity type registry is missing ${type.name}!`);
    return `${namespace}/${type.name}`;
  }
  static getEntityType(typeName) {
    for (const [type, namespace] of this.#entityTypeRegistry.entries())
      if (typeName === `${namespace}/${type.name}`)
        return type;
    throw new Error(`Entity type ${typeName} is not registered!`);
  }
};
var ID_REGEX = new RegExp("^\\p{ID_Start}\\p{ID_Continue}*$", "v");
var isValidPlainIdentifier = /* @__PURE__ */ __name((s) => ID_REGEX.test(s), "isValidPlainIdentifier");
var serializeIdentifier = /* @__PURE__ */ __name((parent, child) => isValidPlainIdentifier(child) ? parent ? `${parent}._.${child}` : `${child}` : parent ? `${parent}._[${JSON.stringify(child)}]` : `[${JSON.stringify(child)}]`, "serializeIdentifier");

// ../engine/entity/entity-store.ts
var EntityStore = class {
  static {
    __name(this, "EntityStore");
  }
  #entitiesById = /* @__PURE__ */ new Map();
  #entitiesByRef = /* @__PURE__ */ new Map();
  #entitiesByType = /* @__PURE__ */ new Map();
  get all() {
    return this.#entitiesById.values();
  }
  lookupById(id) {
    return this.#entitiesById.get(id);
  }
  lookupByRef(ref) {
    return this.#entitiesByRef.get(ref);
  }
  lookupByType(type) {
    const entities = [];
    for (const [ctor, set] of this.#entitiesByType) {
      if (!(ctor === type || ctor.prototype instanceof type))
        continue;
      entities.push(...set.values());
    }
    return entities;
  }
  lookupByPosition(position) {
    const entities = [];
    for (const entity of this.#entitiesById.values()) {
      const bounds = entity.bounds;
      if (!bounds)
        continue;
      const local = pointWorldToLocal(entity.globalTransform, position);
      const inBounds = local.x >= bounds.x / -2 && local.x <= bounds.x / 2 && local.y >= bounds.y / -2 && local.y <= bounds.y / 2;
      if (inBounds)
        entities.push(entity);
    }
    return entities;
  }
  // #region Internal methods
  [entityStoreRegister](entity, oldId) {
    if (oldId && this.#entitiesById.get(oldId) === entity)
      this.#entitiesById.delete(oldId);
    const existingEntity = this.#entitiesByRef.get(entity.ref);
    if (existingEntity && existingEntity !== entity)
      throw new Error("tried to overwrite entity ref: " + entity.ref);
    this.#entitiesByRef.set(entity.ref, entity);
    this.#entitiesById.set(entity.id, entity);
    const type = entity.constructor;
    const set = this.#entitiesByType.get(type) ?? /* @__PURE__ */ new Set();
    set.add(entity);
    this.#entitiesByType.set(type, set);
    if (entity.root) {
      this.#roots.get(entity.root.name)?.[entityStoreRegister](entity, oldId);
    }
  }
  [entityStoreUnregister](entity) {
    this.#entitiesById.delete(entity.id);
    this.#entitiesByRef.delete(entity.ref);
    const type = entity.constructor;
    const set = this.#entitiesByType.get(type);
    if (set)
      set.delete(entity);
    if (entity.root) {
      this.#roots.get(entity.root.name)?.[entityStoreUnregister](entity);
    }
  }
  #roots = /* @__PURE__ */ new Map();
  [entityStoreRegisterRoot](root, store) {
    this.#roots.set(root, store);
  }
  // #endregion
};

// ../engine/entity/entity-roots.ts
var Root = class extends Entity {
  static {
    __name(this, "Root");
  }
  static [internalEntity] = true;
  entities;
  bounds;
  constructor(game, name) {
    super({ game, name, ref: name.toUpperCase() });
    this.entities = new EntityStore();
    game.entities[entityStoreRegisterRoot](`game.${name}`, this.entities);
    game.entities[entityStoreUnregister](this);
    this.name = `game.${name}`;
    this.id = `game.${name}`;
    this.root = this;
    this.pausable = false;
    game.entities[entityStoreRegister](this);
  }
};
var WorldRoot = class extends Root {
  static {
    __name(this, "WorldRoot");
  }
  constructor(game) {
    super(game, "world");
  }
};
var ServerRoot = class extends Root {
  static {
    __name(this, "ServerRoot");
  }
  constructor(game) {
    super(game, "server");
  }
};
var LocalRoot = class extends Root {
  static {
    __name(this, "LocalRoot");
  }
  constructor(game) {
    super(game, "local");
  }
};
var PrefabsRoot = class extends Root {
  static {
    __name(this, "PrefabsRoot");
  }
  constructor(game) {
    super(game, "prefabs");
  }
};

// ../engine/entity/pixi-entity.ts
import * as PIXI2 from "@dreamlab/vendor/pixi.js";
var PixiEntity = class extends Entity {
  static {
    __name(this, "PixiEntity");
  }
  container;
  constructor(ctx) {
    super(ctx);
    this.listen(this.game, GameRender, () => {
      if (!this.container)
        return;
      const pos = this.interpolated.position;
      const rot = this.interpolated.rotation;
      this.container.position = { x: pos.x, y: -pos.y };
      this.container.rotation = -rot;
    });
    this.on(EntityDestroyed, () => {
      this.container?.destroy({ children: true });
    });
  }
  onInitialize() {
    if (!this.game.isClient())
      return;
    this.container = new PIXI2.Container();
    this.game.renderer.scene.addChild(this.container);
  }
};

// ../engine/entity/entities/animated-sprite.ts
import * as PIXI3 from "@dreamlab/vendor/pixi.js";
var AnimatedSprite2D = class _AnimatedSprite2D extends PixiEntity {
  static {
    __name(this, "AnimatedSprite2D");
  }
  static {
    Entity.registerType(this, "@core");
  }
  static icon = "\u{1F5BC}\uFE0F";
  get bounds() {
    return new Vector2(this.width, this.height);
  }
  width = 1;
  height = 1;
  spritesheet = "";
  alpha = 1;
  speed = 0.1;
  loop = true;
  sprite;
  constructor(ctx) {
    super(ctx);
    this.defineValues(_AnimatedSprite2D, "width", "height", "alpha", "speed", "loop");
    this.defineValue(_AnimatedSprite2D, "spritesheet", { type: SpritesheetAdapter });
    if (this.spritesheet !== "") {
      PIXI3.Assets.backgroundLoad(this.game.resolveResource(this.spritesheet));
    }
    this.listen(this.game, GameRender, () => {
      if (!this.sprite)
        return;
      this.sprite.width = this.width * this.globalTransform.scale.x;
      this.sprite.height = this.height * this.globalTransform.scale.y;
      this.sprite.alpha = this.alpha;
    });
    const spritesheetValue = this.values.get("spritesheet");
    this.listen(this.game.values, ValueChanged, async (event) => {
      if (!this.sprite)
        return;
      if (event.value !== spritesheetValue)
        return;
      const textures = await this.#getTextures();
      this.sprite.textures = textures;
      this.sprite.play();
    });
    this.on(EntityDestroyed, () => {
      this.sprite?.destroy();
    });
  }
  async #getTextures() {
    if (this.spritesheet === "")
      return [PIXI3.Texture.WHITE];
    const spritesheet = await PIXI3.Assets.load(this.game.resolveResource(this.spritesheet));
    if (!(spritesheet instanceof PIXI3.Spritesheet)) {
      throw new TypeError("texture is not a pixi sritesheet");
    }
    return Object.values(spritesheet.textures);
  }
  async onInitialize() {
    super.onInitialize();
    if (!this.container)
      return;
    const textures = await this.#getTextures();
    this.sprite = new PIXI3.AnimatedSprite(textures);
    this.sprite.width = this.width * this.globalTransform.scale.x;
    this.sprite.height = this.height * this.globalTransform.scale.y;
    this.sprite.anchor.set(0.5);
    this.sprite.alpha = this.alpha;
    this.sprite.animationSpeed = this.speed;
    this.sprite.loop = this.loop;
    this.sprite.play();
    this.container.addChild(this.sprite);
  }
};

// ../engine/entity/entities/box-resize.ts
import * as PIXI5 from "@dreamlab/vendor/pixi.js";

// ../engine/entity/entities/camera.ts
import * as PIXI4 from "@dreamlab/vendor/pixi.js";
var Camera = class _Camera extends Entity {
  static {
    __name(this, "Camera");
  }
  static {
    Entity.registerType(this, "@core");
  }
  static icon = "\u{1F3A5}";
  static METERS_TO_PIXELS = 100;
  bounds;
  container;
  smooth = 0.01;
  #position = new Vector2(this.interpolated.position);
  #rotation = this.interpolated.rotation;
  #scale = new Vector2(this.interpolated.scale);
  #matrix = new PIXI4.Matrix();
  #updateMatrix() {
    const game = this.game;
    return this.#matrix.identity().translate(-this.#position.x, this.#position.y).rotate(this.#rotation).scale(_Camera.METERS_TO_PIXELS, _Camera.METERS_TO_PIXELS).scale(1 / this.#scale.x, 1 / this.#scale.y).translate(game.renderer.app.canvas.width / 2, game.renderer.app.canvas.height / 2);
  }
  get smoothed() {
    return {
      position: this.#position.bare(),
      rotation: this.#rotation,
      scale: this.#scale.bare()
    };
  }
  #active = false;
  get active() {
    return this.#active;
  }
  set active(value) {
    if (value && this.#active)
      return;
    const previous = _Camera.getActive(this.game);
    if (!value) {
      if (this.#active === true) {
        this.game.fire(ActiveCameraChanged, void 0, this);
      }
      this.#active = false;
      return;
    }
    const cameras = this.game.entities.lookupByType(_Camera);
    for (const camera of cameras)
      camera.active = false;
    this.#active = true;
    this.#position = new Vector2(this.interpolated.position);
    this.#rotation = this.interpolated.rotation;
    this.#scale = new Vector2(this.interpolated.scale);
    const game = this.game;
    this.container.addChild(game.renderer.scene);
    this.game.fire(ActiveCameraChanged, this, previous);
  }
  // TODO: Look into improving this API maybe?
  static getActive(game) {
    return game.entities.lookupByType(_Camera).find((camera) => camera.active);
  }
  constructor(ctx) {
    super(ctx);
    if (ctx.parent !== this.game.local || !this.game.isClient()) {
      throw new Error(`${this.constructor.name} must be spawned as a local client entity`);
    }
    this.defineValues(_Camera, "smooth");
    this.container = new PIXI4.Container();
    this.game.renderer.app.stage.addChild(this.container);
    this.listen(this.game, GameRender, () => {
      if (!this.#active)
        return;
      const delta = this.game.time.delta;
      if (this.smooth === 1) {
        this.#position.x = this.interpolated.position.x;
        this.#position.y = this.interpolated.position.y;
        this.#rotation = this.interpolated.rotation;
        this.#scale.x = this.interpolated.scale.x;
        this.#scale.y = this.interpolated.scale.y;
        this.container.setFromMatrix(this.#updateMatrix());
        return;
      }
      this.#position = Vector2.smoothLerp(
        this.#position,
        this.interpolated.position,
        this.smooth,
        delta
      );
      this.#rotation = smoothLerp(
        this.#rotation,
        this.interpolated.rotation,
        this.smooth,
        delta
      );
      this.#scale = Vector2.smoothLerp(
        this.#scale,
        this.interpolated.scale,
        this.smooth,
        delta
      );
      this.container.setFromMatrix(this.#updateMatrix());
    });
    this.on(EntityDestroyed, () => {
      const game = this.game;
      this.active = false;
      game.renderer.app.stage.addChild(game.renderer.scene);
      this.container.destroy();
    });
    this.active = true;
  }
  worldToScreen(position) {
    const game = this.game;
    const matrix = PIXI4.Matrix.shared.translate(-this.globalTransform.position.x, this.globalTransform.position.y).rotate(this.#rotation).scale(_Camera.METERS_TO_PIXELS, _Camera.METERS_TO_PIXELS).scale(1 / this.#scale.x, 1 / this.#scale.y).translate(game.renderer.app.canvas.width / 2, game.renderer.app.canvas.height / 2);
    const { x, y } = matrix.apply({ x: position.x, y: -position.y });
    return new Vector2(x, y);
  }
  screenToWorld(position) {
    const game = this.game;
    const matrix = PIXI4.Matrix.shared.translate(-this.globalTransform.position.x, this.globalTransform.position.y).rotate(this.#rotation).scale(_Camera.METERS_TO_PIXELS, _Camera.METERS_TO_PIXELS).scale(1 / this.#scale.x, 1 / this.#scale.y).translate(game.renderer.app.canvas.width / 2, game.renderer.app.canvas.height / 2);
    const { x, y } = matrix.applyInverse(position);
    return new Vector2(x, -y);
  }
};

// ../engine/entity/entities/clickable.ts
var clickedSetter = Symbol.for("dreamlab.internal.clickable.clicked-setter");
var hoverSetter = Symbol.for("dreamlab.internal.clickable.hover-setter");
var ClickableEntity = class _ClickableEntity extends Entity {
  static {
    __name(this, "ClickableEntity");
  }
  #clicked = false;
  get clicked() {
    return this.#clicked;
  }
  [clickedSetter](value, button, cursor) {
    const prev = this.#clicked;
    this.#clicked = value;
    if (!prev && value) {
      const x = { screen: cursor.screen, world: cursor.world };
      this.fire(MouseDown, button, x);
      if (button === "left")
        this.fire(Click, x);
    } else if (prev && !value) {
      this.fire(MouseUp, button, cursor);
    }
  }
  #hover = false;
  get hover() {
    return this.#hover;
  }
  [hoverSetter](value, cursor) {
    const prev = this.#hover;
    this.#hover = value;
    if (!prev && value) {
      this.fire(MouseOver, { screen: cursor.screen, world: cursor.world });
    } else if (prev && !value) {
      this.fire(MouseOut, cursor);
    }
  }
  static #GameRenderListeners = /* @__PURE__ */ new Map();
  static #MouseDownListeners = /* @__PURE__ */ new Map();
  static #MouseUpListeners = /* @__PURE__ */ new Map();
  constructor(ctx) {
    super(ctx);
    if (this.game.isClient()) {
      if (!_ClickableEntity.#GameRenderListeners.has(this.game)) {
        const canvas = document.getElementById("dreamlab-pointer-style-target") ?? this.game.renderer.app.canvas;
        const fn = /* @__PURE__ */ __name((_) => {
          const cursor = this.inputs.cursor;
          const entities = this.game.entities.lookupByType(_ClickableEntity).toSorted((a, b) => b.z - a.z);
          let hoverCount = 0;
          for (const entity of entities) {
            const isInBounds = hoverCount > 0 ? false : (cursor.world && entity.isInBounds(cursor.world)) ?? false;
            entity[hoverSetter](isInBounds, cursor);
            if (isInBounds)
              hoverCount++;
          }
          if (hoverCount > 0)
            canvas.style.cursor = "pointer";
          else
            canvas.style.cursor = "";
        }, "fn");
        _ClickableEntity.#GameRenderListeners.set(this.game, fn);
        this.game.on(GameRender, fn);
      }
      if (!_ClickableEntity.#MouseDownListeners.has(this.game)) {
        const fn = /* @__PURE__ */ __name(({ button, cursor }) => {
          const entities = this.game.entities.lookupByType(_ClickableEntity).toSorted((a, b) => b.z - a.z);
          let clickedCount = 0;
          for (const entity of entities) {
            const isInBounds = clickedCount > 0 ? false : entity.isInBounds(cursor.world);
            if (isInBounds) {
              entity[clickedSetter](true, button, cursor);
              clickedCount++;
            }
          }
        }, "fn");
        _ClickableEntity.#MouseDownListeners.set(this.game, fn);
        this.inputs.on(MouseDown, fn);
      }
      if (!_ClickableEntity.#MouseUpListeners.has(this.game)) {
        const fn = /* @__PURE__ */ __name(({ button, cursor }) => {
          const entities = this.game.entities.lookupByType(_ClickableEntity);
          for (const entity of entities)
            entity[clickedSetter](false, button, cursor);
        }, "fn");
        _ClickableEntity.#MouseUpListeners.set(this.game, fn);
        this.inputs.on(MouseUp, fn);
      }
    }
    this.listen(this.game, GameRender, () => {
      const camera = Camera.getActive(this.game);
      if (!camera)
        return;
      const cursor = this.inputs.cursor;
      if (!cursor)
        return;
    });
  }
};
var ClickableRect = class _ClickableRect extends ClickableEntity {
  static {
    __name(this, "ClickableRect");
  }
  static {
    Entity.registerType(this, "@core");
  }
  static icon = "\u{1F446}";
  get bounds() {
    return new Vector2(this.width, this.height);
  }
  width = 1;
  height = 1;
  constructor(ctx) {
    super(ctx);
    this.defineValues(_ClickableRect, "width", "height");
  }
  isInBounds(worldPosition) {
    const localPosition = pointWorldToLocal(this.globalTransform, worldPosition);
    return localPosition.x >= this.width / -2 && localPosition.x <= this.width / 2 && localPosition.y >= this.height / -2 && localPosition.y <= this.height / 2;
  }
};
var ClickableCircle = class _ClickableCircle extends ClickableEntity {
  static {
    __name(this, "ClickableCircle");
  }
  static {
    Entity.registerType(this, "@core");
  }
  static icon = "\u{1F446}";
  get bounds() {
    const size = this.radius * 2;
    return new Vector2(size, size);
  }
  radius = 1;
  innerRadus = 0;
  constructor(ctx) {
    super(ctx);
    this.defineValues(_ClickableCircle, "radius", "innerRadus");
  }
  isInBounds(worldPosition) {
    const localPosition = pointWorldToLocal(this.globalTransform, worldPosition);
    const radiusSq = this.radius * this.radius;
    const innerSq = this.innerRadus * this.innerRadus;
    const distanceSq = localPosition.magnitudeSquared();
    return distanceSq >= innerSq && distanceSq <= radiusSq;
  }
};

// ../engine/entity/entities/box-resize.ts
var BoxResizeGizmo = class _BoxResizeGizmo extends Entity {
  static {
    __name(this, "BoxResizeGizmo");
  }
  static {
    Entity.registerType(this, "@core");
  }
  bounds;
  static #STROKE_WIDTH = 5 / 100;
  static #CLICK_WIDTH = _BoxResizeGizmo.#STROKE_WIDTH * 2.5;
  static #CORNER_WIDTH = _BoxResizeGizmo.#CLICK_WIDTH * 1.25;
  #gfx;
  #target;
  get target() {
    return this.#target;
  }
  set target(value) {
    this.#target = value;
    this.#updateHandles();
  }
  // #region Handles
  #updateHandles() {
    this.children.forEach((c) => c.destroy());
    const entity = this.#target;
    if (!entity)
      return;
    const bounds = entity.bounds;
    if (!bounds)
      return;
    const scaled = Vector2.mul(bounds, entity.globalTransform.scale);
    const leftEdge = this.spawn({
      type: ClickableRect,
      name: "LeftEdge",
      transform: {
        z: 999999,
        position: { x: -(scaled.x / 2 + _BoxResizeGizmo.#CLICK_WIDTH / 2), y: 0 }
      },
      values: { width: _BoxResizeGizmo.#CLICK_WIDTH, height: scaled.y }
    });
    const rightEdge = this.spawn({
      type: ClickableRect,
      name: "RightEdge",
      transform: {
        z: 999999,
        position: { x: scaled.x / 2 + _BoxResizeGizmo.#CLICK_WIDTH / 2, y: 0 }
      },
      values: { width: _BoxResizeGizmo.#CLICK_WIDTH, height: scaled.y }
    });
    const topEdge = this.spawn({
      type: ClickableRect,
      name: "TopEdge",
      transform: {
        z: 999999,
        position: { x: 0, y: scaled.y / 2 + _BoxResizeGizmo.#CLICK_WIDTH / 2 }
      },
      values: { width: scaled.x, height: _BoxResizeGizmo.#CLICK_WIDTH }
    });
    const bottomEdge = this.spawn({
      type: ClickableRect,
      name: "BottomEdge",
      transform: {
        z: 999999,
        position: { x: 0, y: -(scaled.y / 2 + _BoxResizeGizmo.#CLICK_WIDTH / 2) }
      },
      values: { width: scaled.x, height: _BoxResizeGizmo.#CLICK_WIDTH }
    });
    const topLeft = this.spawn({
      type: ClickableRect,
      name: "TopLeft",
      transform: {
        z: 1e6,
        position: {
          x: -(scaled.x / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2),
          y: scaled.y / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2
        }
      },
      values: { width: _BoxResizeGizmo.#CORNER_WIDTH, height: _BoxResizeGizmo.#CORNER_WIDTH }
    });
    const topRight = this.spawn({
      type: ClickableRect,
      name: "TopRight",
      transform: {
        z: 1e6,
        position: {
          x: scaled.x / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2,
          y: scaled.y / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2
        }
      },
      values: { width: _BoxResizeGizmo.#CORNER_WIDTH, height: _BoxResizeGizmo.#CORNER_WIDTH }
    });
    const bottomLeft = this.spawn({
      type: ClickableRect,
      name: "BottomLeft",
      transform: {
        z: 1e6,
        position: {
          x: -(scaled.x / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2),
          y: -(scaled.y / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2)
        }
      },
      values: { width: _BoxResizeGizmo.#CORNER_WIDTH, height: _BoxResizeGizmo.#CORNER_WIDTH }
    });
    const bottomRight = this.spawn({
      type: ClickableRect,
      name: "BottomRight",
      transform: {
        z: 1e6,
        position: {
          x: scaled.x / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2,
          y: -(scaled.y / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2)
        }
      },
      values: { width: _BoxResizeGizmo.#CORNER_WIDTH, height: _BoxResizeGizmo.#CORNER_WIDTH }
    });
    const onMouseDown = /* @__PURE__ */ __name((handle) => ({ button, cursor: { world } }) => {
      if (button !== "left")
        return;
      const offset = world.sub(this.globalTransform.position);
      this.#action = {
        type: "scale",
        handle,
        offset,
        transform: new Transform(entity.transform),
        globalTransform: new Transform(entity.globalTransform)
      };
    }, "onMouseDown");
    leftEdge.on(MouseDown, onMouseDown("l"));
    rightEdge.on(MouseDown, onMouseDown("r"));
    topEdge.on(MouseDown, onMouseDown("t"));
    bottomEdge.on(MouseDown, onMouseDown("b"));
    topLeft.on(MouseDown, onMouseDown("tl"));
    topRight.on(MouseDown, onMouseDown("tr"));
    bottomLeft.on(MouseDown, onMouseDown("bl"));
    bottomRight.on(MouseDown, onMouseDown("br"));
    const translateOnMouseDown = /* @__PURE__ */ __name((axis) => ({ button, cursor: { world } }) => {
      if (button !== "left")
        return;
      const offset = world.sub(this.globalTransform.position);
      this.#action = { type: "translate", axis, offset };
    }, "translateOnMouseDown");
    const translateBoth = this.spawn({
      type: ClickableRect,
      name: "TranslateBoth",
      transform: { position: { x: 0, y: 0 } },
      values: { width: 0.3, height: 0.3 }
    });
    translateBoth.on(MouseDown, translateOnMouseDown("both"));
  }
  #updateHandlePositions() {
    const entity = this.#target;
    if (!entity)
      return;
    const bounds = entity.bounds;
    if (!bounds)
      return;
    const scaled = Vector2.mul(bounds, entity.globalTransform.scale);
    const leftEdge = this.children.get("LeftEdge")?.cast(ClickableRect);
    if (leftEdge) {
      leftEdge.height = scaled.y;
      leftEdge.transform.position.x = -(scaled.x / 2 + _BoxResizeGizmo.#CLICK_WIDTH / 2);
    }
    const rightEdge = this.children.get("RightEdge")?.cast(ClickableRect);
    if (rightEdge) {
      rightEdge.height = scaled.y;
      rightEdge.transform.position.x = scaled.x / 2 + _BoxResizeGizmo.#CLICK_WIDTH / 2;
    }
    const topEdge = this.children.get("TopEdge")?.cast(ClickableRect);
    if (topEdge) {
      topEdge.width = scaled.x;
      topEdge.transform.position.y = scaled.y / 2 + _BoxResizeGizmo.#CLICK_WIDTH / 2;
    }
    const bottomEdge = this.children.get("BottomEdge")?.cast(ClickableRect);
    if (bottomEdge) {
      bottomEdge.width = scaled.x;
      bottomEdge.transform.position.y = -(scaled.y / 2 + _BoxResizeGizmo.#CLICK_WIDTH / 2);
    }
    const topLeft = this.children.get("TopLeft")?.cast(ClickableRect);
    if (topLeft) {
      topLeft.transform.position.x = -(scaled.x / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2);
      topLeft.transform.position.y = scaled.y / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2;
    }
    const topRight = this.children.get("TopRight")?.cast(ClickableRect);
    if (topRight) {
      topRight.transform.position.x = scaled.x / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2;
      topRight.transform.position.y = scaled.y / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2;
    }
    const bottomLeft = this.children.get("BottomLeft")?.cast(ClickableRect);
    if (bottomLeft) {
      bottomLeft.transform.position.x = -(scaled.x / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2);
      bottomLeft.transform.position.y = -(scaled.y / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2);
    }
    const bottomRight = this.children.get("BottomRight")?.cast(ClickableRect);
    if (bottomRight) {
      bottomRight.transform.position.x = scaled.x / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2;
      bottomRight.transform.position.y = -(scaled.y / 2 + _BoxResizeGizmo.#CORNER_WIDTH / 2);
    }
  }
  // #endregion
  // #region Action / Signals
  #action;
  #onMouseMove = (_) => {
    if (!this.#target)
      return;
    if (!this.#action)
      return;
    const cursor = this.inputs.cursor;
    if (!cursor.world)
      return;
    const pos = cursor.world.sub(this.#action.offset);
    if (this.#action.type === "translate") {
      const local2 = pointWorldToLocal(this.globalTransform, pos);
      if (this.#action.axis === "x")
        local2.y = 0;
      if (this.#action.axis === "y")
        local2.x = 0;
      const world = pointLocalToWorld(this.globalTransform, local2);
      this.#target.globalTransform.position = world;
      return;
    }
    const local = pointWorldToLocal(this.#action.globalTransform, pos);
    const scaled = this.#action.transform.scale.mul(local);
    switch (this.#action.handle) {
      case "l": {
        this.#target.transform.scale.x = this.#action.transform.scale.x - scaled.x;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled.x / 2;
        break;
      }
      case "r": {
        this.#target.transform.scale.x = this.#action.transform.scale.x + scaled.x;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled.x / 2;
        break;
      }
      case "t": {
        this.#target.transform.scale.y = this.#action.transform.scale.y + scaled.y;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled.y / 2;
        break;
      }
      case "b": {
        this.#target.transform.scale.y = this.#action.transform.scale.y - scaled.y;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled.y / 2;
        break;
      }
      case "tl": {
        this.#target.transform.scale.x = this.#action.transform.scale.x - scaled.x;
        this.#target.transform.scale.y = this.#action.transform.scale.y + scaled.y;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled.x / 2;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled.y / 2;
        break;
      }
      case "tr": {
        const scaled2 = this.#action.transform.scale.mul(local);
        this.#target.transform.scale.x = this.#action.transform.scale.x + scaled2.x;
        this.#target.transform.scale.y = this.#action.transform.scale.y + scaled2.y;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled2.x / 2;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled2.y / 2;
        break;
      }
      case "bl": {
        const scaled2 = this.#action.transform.scale.mul(local);
        this.#target.transform.scale.x = this.#action.transform.scale.x - scaled2.x;
        this.#target.transform.scale.y = this.#action.transform.scale.y - scaled2.y;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled2.x / 2;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled2.y / 2;
        break;
      }
      case "br": {
        const scaled2 = this.#action.transform.scale.mul(local);
        this.#target.transform.scale.x = this.#action.transform.scale.x + scaled2.x;
        this.#target.transform.scale.y = this.#action.transform.scale.y - scaled2.y;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled2.x / 2;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled2.y / 2;
        break;
      }
    }
  };
  #onMouseUp = (_) => {
    if (!this.#action)
      return;
    this.#action = void 0;
  };
  // #endregion
  constructor(ctx) {
    super(ctx);
    if (ctx.parent !== this.game.local || !this.game.isClient()) {
      throw new Error(`${this.constructor.name} must be spawned as a local client entity`);
    }
    this.listen(this.game, GameRender, () => {
      if (!this.#gfx)
        return;
      this.#gfx.clear();
      const entity = this.#target;
      if (!entity)
        return;
      const pos = entity.pos;
      this.pos.assign(entity.pos);
      const bounds = entity.bounds;
      if (!bounds)
        return;
      this.#updateHandlePositions();
      const halfx = bounds.x / 2;
      const halfy = bounds.y / 2;
      const a = pointLocalToWorld(entity.globalTransform, { x: -halfx, y: -halfy });
      const b = pointLocalToWorld(entity.globalTransform, { x: -halfx, y: halfy });
      const c = pointLocalToWorld(entity.globalTransform, { x: halfx, y: -halfy });
      const d = pointLocalToWorld(entity.globalTransform, { x: halfx, y: halfy });
      a.y = -a.y;
      b.y = -b.y;
      c.y = -c.y;
      d.y = -d.y;
      this.#gfx.poly([a, b, d, c]).stroke({
        width: _BoxResizeGizmo.#STROKE_WIDTH,
        color: "22a2ff",
        alpha: 1,
        alignment: -0
      }).rect(pos.x - 0.15, -(pos.y + 0.15), 0.3, 0.3).fill({ alpha: 0.2, color: "blue" }).stroke({ alpha: 0.5, color: "blue", width: 0.01 });
    });
    this.on(EntityDestroyed, () => {
      this.#gfx?.destroy();
      if (this.game.isClient()) {
        const canvas = this.game.renderer.app.canvas;
        canvas.removeEventListener("mousemove", this.#onMouseMove);
        canvas.removeEventListener("mouseup", this.#onMouseUp);
      }
    });
  }
  onInitialize() {
    if (!this.game.isClient())
      return;
    this.#gfx = new PIXI5.Graphics({ zIndex: 9999999999 });
    this.game.renderer.scene.addChild(this.#gfx);
    this.#updateHandles();
    const canvas = this.game.renderer.app.canvas;
    canvas.addEventListener("mousemove", this.#onMouseMove);
    canvas.addEventListener("mouseup", this.#onMouseUp);
  }
};

// ../engine/entity/entities/collider.ts
import RAPIER2 from "@dreamlab/vendor/rapier.js";
var RectCollider2D = class extends Entity {
  static {
    __name(this, "RectCollider2D");
  }
  static {
    Entity.registerType(this, "@core");
  }
  static icon = "\u2B1C";
  get bounds() {
    return new Vector2(this.#shape.halfExtents.x * 2, this.#shape.halfExtents.y * 2);
  }
  collider;
  #shape;
  constructor(ctx) {
    super(ctx);
    const desc = RAPIER2.ColliderDesc.cuboid(
      this.globalTransform.scale.x / 2,
      this.globalTransform.scale.y / 2
    ).setTranslation(this.globalTransform.position.x, this.globalTransform.position.y).setRotation(this.globalTransform.rotation);
    this.collider = this.game.physics.world.createCollider(desc);
    this.collider.setActiveEvents(RAPIER2.ActiveEvents.COLLISION_EVENTS);
    this.#shape = this.collider.shape;
    this.on(EntityPreUpdate, () => {
      if (!this.game.physics.enabled)
        return;
      this.collider.setTranslation({
        x: this.globalTransform.position.x,
        y: this.globalTransform.position.y
      });
      this.collider.setRotation(this.globalTransform.rotation);
      this.#shape.halfExtents = {
        x: this.globalTransform.scale.x / 2,
        y: this.globalTransform.scale.y / 2
      };
    });
    this.on(EntityUpdate, () => {
      if (!this.game.physics.enabled)
        return;
      this.globalTransform.position = new Vector2(this.collider.translation());
      this.globalTransform.rotation = this.collider.rotation();
      this.globalTransform.scale = new Vector2(
        this.#shape.halfExtents.x * 2,
        this.#shape.halfExtents.y * 2
      );
    });
  }
};

// ../engine/entity/entities/empty.ts
var Empty = class extends Entity {
  static {
    __name(this, "Empty");
  }
  static {
    Entity.registerType(this, "@core");
  }
  static icon = "\u{1F4E6}";
  bounds = Object.freeze({ x: 0.5, y: 0.5 });
};

// ../engine/entity/entities/gizmo.ts
import * as PIXI6 from "@dreamlab/vendor/pixi.js";
var GizmoTranslateStart = class {
  constructor(axis) {
    this.axis = axis;
  }
  static {
    __name(this, "GizmoTranslateStart");
  }
  [exclusiveSignalType] = Gizmo;
};
var GizmoTranslateMove = class {
  constructor(position) {
    this.position = position;
  }
  static {
    __name(this, "GizmoTranslateMove");
  }
  [exclusiveSignalType] = Gizmo;
};
var GizmoTranslateEnd = class {
  static {
    __name(this, "GizmoTranslateEnd");
  }
  [exclusiveSignalType] = Gizmo;
};
var GizmoRotateStart = class {
  static {
    __name(this, "GizmoRotateStart");
  }
  [exclusiveSignalType] = Gizmo;
};
var GizmoRotateMove = class {
  constructor(rotation) {
    this.rotation = rotation;
  }
  static {
    __name(this, "GizmoRotateMove");
  }
  [exclusiveSignalType] = Gizmo;
};
var GizmoRotateEnd = class {
  static {
    __name(this, "GizmoRotateEnd");
  }
  [exclusiveSignalType] = Gizmo;
};
var GizmoScaleStart = class {
  constructor(axis) {
    this.axis = axis;
  }
  static {
    __name(this, "GizmoScaleStart");
  }
  [exclusiveSignalType] = Gizmo;
};
var GizmoScaleMove = class {
  constructor(scale) {
    this.scale = scale;
  }
  static {
    __name(this, "GizmoScaleMove");
  }
  [exclusiveSignalType] = Gizmo;
};
var GizmoScaleEnd = class {
  static {
    __name(this, "GizmoScaleEnd");
  }
  [exclusiveSignalType] = Gizmo;
};
var Gizmo = class _Gizmo extends Entity {
  static {
    __name(this, "Gizmo");
  }
  static {
    Entity.registerType(this, "@core");
  }
  static icon = "\u27A1\uFE0F";
  bounds;
  // #region Graphics
  static #X_COLOR = "red";
  static #Y_COLOR = "green";
  static #Z_COLOR = "blue";
  static #NEUTRAL_COLOR = "gray";
  static #ARROW_W = 0.1;
  static #ARROW_H = 0.15;
  static #SCALE_S = 0.15;
  static #blankCtx = new PIXI6.GraphicsContext();
  static #translateCtx = new PIXI6.GraphicsContext().moveTo(0, 0).lineTo(1, 0).stroke({ color: _Gizmo.#X_COLOR, width: 0.02 }).moveTo(0, 0).lineTo(0, -1).stroke({ color: _Gizmo.#Y_COLOR, width: 0.02 }).moveTo(0.2, 0.2).rect(0.1, -0.4, 0.3, 0.3).fill({ alpha: 0.2, color: _Gizmo.#Z_COLOR }).stroke({ alpha: 0.5, color: _Gizmo.#Z_COLOR, width: 0.01 }).poly([1, _Gizmo.#ARROW_W / 2, 1, -_Gizmo.#ARROW_W / 2, 1 + _Gizmo.#ARROW_H, 0]).fill(_Gizmo.#X_COLOR).poly([_Gizmo.#ARROW_W / 2, -1, -_Gizmo.#ARROW_W / 2, -1, 0, -1 - _Gizmo.#ARROW_H]).fill(_Gizmo.#Y_COLOR);
  static #rotateCtx = new PIXI6.GraphicsContext().moveTo(-1, 0).lineTo(1, 0).stroke({ color: _Gizmo.#X_COLOR, width: 0.02, alpha: 0.6 }).moveTo(0, 1).lineTo(0, -1).stroke({ color: _Gizmo.#Y_COLOR, width: 0.02, alpha: 0.6 }).scale(0.1).circle(0, 0, 10).stroke({ color: _Gizmo.#NEUTRAL_COLOR, width: 0.02 });
  static #scaleCtx = new PIXI6.GraphicsContext().moveTo(0, 0).lineTo(1, 0).stroke({ color: _Gizmo.#X_COLOR, width: 0.02 }).moveTo(0, 0).lineTo(0, -1).stroke({ color: _Gizmo.#Y_COLOR, width: 0.02 }).moveTo(0.2, 0.2).rect(1, -_Gizmo.#SCALE_S / 2, _Gizmo.#SCALE_S, _Gizmo.#SCALE_S).fill(_Gizmo.#X_COLOR).rect(-_Gizmo.#SCALE_S / 2, -1 - _Gizmo.#SCALE_S, _Gizmo.#SCALE_S, _Gizmo.#SCALE_S).fill(_Gizmo.#Y_COLOR).rect(0.1, -0.4, 0.3, 0.3).fill({ alpha: 0.2, color: _Gizmo.#Z_COLOR }).stroke({ alpha: 0.5, color: _Gizmo.#Z_COLOR, width: 0.01 });
  static #combinedCtx = new PIXI6.GraphicsContext().moveTo(0, 0).lineTo(0.7, 0).stroke({ color: _Gizmo.#X_COLOR, width: 0.02 }).moveTo(0, 0).lineTo(0, -0.7).stroke({ color: _Gizmo.#Y_COLOR, width: 0.02 }).rect(0.7, -_Gizmo.#SCALE_S / 2, _Gizmo.#SCALE_S, _Gizmo.#SCALE_S).fill(_Gizmo.#X_COLOR).rect(-_Gizmo.#SCALE_S / 2, -0.7 - _Gizmo.#SCALE_S, _Gizmo.#SCALE_S, _Gizmo.#SCALE_S).fill(_Gizmo.#Y_COLOR).poly([1.1, _Gizmo.#ARROW_W / 2, 1.1, -_Gizmo.#ARROW_W / 2, 1.1 + _Gizmo.#ARROW_H, 0]).fill(_Gizmo.#X_COLOR).poly([_Gizmo.#ARROW_W / 2, -1.1, -_Gizmo.#ARROW_W / 2, -1.1, 0, -1.1 - _Gizmo.#ARROW_H]).fill(_Gizmo.#Y_COLOR).moveTo(0, 0).rect(-0.15, -0.15, 0.3, 0.3).fill({ alpha: 0.2, color: _Gizmo.#Z_COLOR }).stroke({ alpha: 0.5, color: _Gizmo.#Z_COLOR, width: 0.01 }).scale(0.1).circle(0, 0, 10).stroke({ color: _Gizmo.#NEUTRAL_COLOR, width: 0.02 });
  #gfx;
  get #ctx() {
    if (!this.#target)
      return _Gizmo.#blankCtx;
    if (this.mode === "translate")
      return _Gizmo.#translateCtx;
    else if (this.mode === "rotate")
      return _Gizmo.#rotateCtx;
    else if (this.mode === "scale")
      return _Gizmo.#scaleCtx;
    else if (this.mode === "combined")
      return _Gizmo.#combinedCtx;
    else
      throw new Error("invalid mode");
  }
  // #endregion
  // #region Mode
  #mode = "combined";
  get mode() {
    return this.#mode;
  }
  set mode(value) {
    this.#mode = value;
    if (this.#gfx)
      this.#gfx.context = this.#ctx;
    this.#updateHandles();
  }
  // #endregion
  // #region Handles
  #updateHandles() {
    this.children.forEach((c) => c.destroy());
    if (!this.#target)
      return;
    if (this.mode === "translate")
      this.#translateHandles();
    else if (this.mode === "rotate")
      this.#rotateHandles();
    else if (this.mode === "scale")
      this.#scaleHandles();
    else if (this.mode === "combined")
      this.#combinedHandles();
    else
      throw new Error("invalid mode");
  }
  #translateHandles() {
    const handleSize = Math.max(_Gizmo.#ARROW_W, _Gizmo.#ARROW_H);
    const clickSize = handleSize * 1.333;
    const translateX = this.spawn({
      type: ClickableRect,
      name: "TranslateX",
      transform: { position: { x: 1 + handleSize / 2, y: 0 } },
      values: { width: clickSize, height: clickSize }
    });
    const translateY = this.spawn({
      type: ClickableRect,
      name: "TranslateY",
      transform: { position: { x: 0, y: 1 + handleSize / 2 } },
      values: { width: clickSize, height: clickSize }
    });
    const translateBoth = this.spawn({
      type: ClickableRect,
      name: "TranslateBoth",
      transform: { position: { x: 0.25, y: 0.25 } },
      values: { width: 0.3, height: 0.3 }
    });
    const onMouseDown = /* @__PURE__ */ __name((axis) => ({ button, cursor: { world } }) => {
      if (button !== "left")
        return;
      const offset = world.sub(this.globalTransform.position);
      this.#action = { type: "translate", axis, offset };
      this.fire(GizmoTranslateStart, axis);
    }, "onMouseDown");
    translateX.on(MouseDown, onMouseDown("x"));
    translateY.on(MouseDown, onMouseDown("y"));
    translateBoth.on(MouseDown, onMouseDown("both"));
  }
  #rotateHandles() {
    const width = 0.4;
    const rotate = this.spawn({
      type: ClickableCircle,
      name: "Rotate",
      values: { radius: 1 + width / 2, innerRadus: 1 - width / 2 }
    });
    rotate.on(MouseDown, ({ button, cursor: { world } }) => {
      if (button !== "left")
        return;
      const pos = world.sub(this.globalTransform.position);
      const rot = Math.atan2(pos.x, pos.y);
      this.#action = { type: "rotate", offset: rot + this.globalTransform.rotation };
      this.fire(GizmoRotateStart);
    });
  }
  #scaleHandles() {
    const handleSize = _Gizmo.#SCALE_S;
    const clickSize = handleSize * 1.333;
    const scaleX = this.spawn({
      type: ClickableRect,
      name: "ScaleX",
      transform: { position: { x: 1 + handleSize / 2, y: 0 } },
      values: { width: clickSize, height: clickSize }
    });
    const scaleY = this.spawn({
      type: ClickableRect,
      name: "ScaleY",
      transform: { position: { x: 0, y: 1 + handleSize / 2 } },
      values: { width: clickSize, height: clickSize }
    });
    const scaleBoth = this.spawn({
      type: ClickableRect,
      name: "ScaleBoth",
      transform: { position: { x: 0.25, y: 0.25 } },
      values: { width: 0.3, height: 0.3 }
    });
    const onMouseDown = /* @__PURE__ */ __name((axis) => ({ button, cursor: { world } }) => {
      if (button !== "left")
        return;
      const offset = world.sub(this.globalTransform.position);
      const original = this.#target.globalTransform.scale.clone();
      this.#action = { type: "scale", axis, offset, original };
      this.fire(GizmoScaleStart, axis);
    }, "onMouseDown");
    scaleX.on(MouseDown, onMouseDown("x"));
    scaleY.on(MouseDown, onMouseDown("y"));
    scaleBoth.on(MouseDown, onMouseDown("both"));
  }
  #combinedHandles() {
    const translateHandleSize = Math.max(_Gizmo.#ARROW_W, _Gizmo.#ARROW_H);
    const translateClickSize = translateHandleSize * 1.333;
    const translateX = this.spawn({
      type: ClickableRect,
      name: "TranslateX",
      transform: { position: { x: 1.1 + translateHandleSize / 2, y: 0 } },
      values: { width: translateClickSize, height: translateClickSize }
    });
    const translateY = this.spawn({
      type: ClickableRect,
      name: "TranslateY",
      transform: { position: { x: 0, y: 1.1 + translateHandleSize / 2 } },
      values: { width: translateClickSize, height: translateClickSize }
    });
    const translateBoth = this.spawn({
      type: ClickableRect,
      name: "TranslateBoth",
      transform: { position: { x: 0, y: 0 } },
      values: { width: 0.3, height: 0.3 }
    });
    const rotate = this.spawn({
      type: ClickableCircle,
      name: "Rotate",
      values: { radius: 1.05, innerRadus: 0.95 }
    });
    const scaleHandleSize = _Gizmo.#SCALE_S;
    const scaleClickSize = scaleHandleSize * 1.333;
    const scaleX = this.spawn({
      type: ClickableRect,
      name: "ScaleX",
      transform: { position: { x: 0.7 + scaleHandleSize / 2, y: 0 } },
      values: { width: scaleClickSize, height: scaleClickSize }
    });
    const scaleY = this.spawn({
      type: ClickableRect,
      name: "ScaleY",
      transform: { position: { x: 0, y: 0.7 + scaleHandleSize / 2 } },
      values: { width: scaleClickSize, height: scaleClickSize }
    });
    const translateOnMouseDown = /* @__PURE__ */ __name((axis) => ({ button, cursor: { world } }) => {
      if (button !== "left")
        return;
      const offset = world.sub(this.globalTransform.position);
      this.#action = { type: "translate", axis, offset };
      this.fire(GizmoTranslateStart, axis);
    }, "translateOnMouseDown");
    translateX.on(MouseDown, translateOnMouseDown("x"));
    translateY.on(MouseDown, translateOnMouseDown("y"));
    translateBoth.on(MouseDown, translateOnMouseDown("both"));
    rotate.on(MouseDown, ({ button, cursor: { world } }) => {
      if (button !== "left")
        return;
      const pos = world.sub(this.globalTransform.position);
      const rot = Math.atan2(pos.x, pos.y);
      this.#action = { type: "rotate", offset: rot + this.globalTransform.rotation };
      this.fire(GizmoRotateStart);
    });
    const scaleOnMouseDown = /* @__PURE__ */ __name((axis) => ({ button, cursor: { world } }) => {
      if (button !== "left")
        return;
      const offset = world.sub(this.globalTransform.position);
      const original = this.#target.globalTransform.scale.clone();
      this.#action = { type: "scale", axis, offset, original };
      this.fire(GizmoScaleStart, axis);
    }, "scaleOnMouseDown");
    scaleX.on(MouseDown, scaleOnMouseDown("x"));
    scaleY.on(MouseDown, scaleOnMouseDown("y"));
  }
  // #endregion
  // #region Action / Signals
  #action;
  #onMouseMove = (_) => {
    if (!this.#target)
      return;
    if (!this.#action)
      return;
    const cursor = this.inputs.cursor;
    if (!cursor.world)
      return;
    if (this.#action.type === "translate") {
      const pos = cursor.world.sub(this.#action.offset);
      const local = pointWorldToLocal(this.globalTransform, pos);
      if (this.#action.axis === "x")
        local.y = 0;
      if (this.#action.axis === "y")
        local.x = 0;
      const world = pointLocalToWorld(this.globalTransform, local);
      this.fire(GizmoTranslateMove, world);
      this.#target.globalTransform.position = world;
    } else if (this.#action.type === "rotate") {
      const pos = cursor.world.sub(this.globalTransform.position);
      const rot = Math.atan2(pos.x, pos.y);
      const rotation = -rot + this.#action.offset;
      this.fire(GizmoRotateMove, rotation);
      this.#target.globalTransform.rotation = rotation;
    } else if (this.#action.type === "scale") {
      const originalDistance = this.#action.offset.magnitude();
      const offset = cursor.world.sub(this.globalTransform.position);
      const offsetDistance = offset.magnitude();
      const mul = Vector2.splat(offsetDistance / originalDistance);
      if (this.#action.axis === "x")
        mul.y = 1;
      if (this.#action.axis === "y")
        mul.x = 1;
      const scale = this.#action.original.mul(mul);
      this.fire(GizmoScaleMove, scale);
      this.#target.globalTransform.scale = scale;
    }
  };
  #onMouseUp = (_) => {
    if (!this.#action)
      return;
    if (this.#action.type === "translate") {
      this.fire(GizmoTranslateEnd);
    } else if (this.#action.type === "rotate") {
      this.fire(GizmoRotateEnd);
    } else if (this.#action.type === "scale") {
      this.fire(GizmoScaleEnd);
    }
    this.#action = void 0;
  };
  // #endregion
  #target;
  get target() {
    return this.#target;
  }
  set target(value) {
    this.#target = value;
    if (this.#gfx)
      this.#gfx.context = this.#ctx;
    this.#updateHandles();
  }
  constructor(ctx) {
    super(ctx);
    if (ctx.parent !== this.game.local || !this.game.isClient()) {
      throw new Error(`${this.constructor.name} must be spawned as a local client entity`);
    }
    this.listen(this.game, GameRender, () => {
      if (!this.#gfx)
        return;
      if (this.#target) {
        this.globalTransform.position = this.#target.globalTransform.position;
        this.globalTransform.rotation = this.#target.globalTransform.rotation;
      }
      const pos = this.globalTransform.position;
      const rotation = this.globalTransform.rotation;
      this.#gfx.position = { x: pos.x, y: -pos.y };
      this.#gfx.rotation = -rotation;
      const camera = Camera.getActive(this.game);
      if (camera) {
        this.#gfx.scale = camera.smoothed.scale;
        this.globalTransform.scale = camera.smoothed.scale;
      } else {
        this.#gfx.scale = 1;
      }
    });
    this.on(EntityDestroyed, () => {
      this.#gfx?.destroy();
      if (this.game.isClient()) {
        const canvas = this.game.renderer.app.canvas;
        canvas.removeEventListener("mousemove", this.#onMouseMove);
        canvas.removeEventListener("mouseup", this.#onMouseUp);
      }
    });
  }
  onInitialize() {
    if (!this.game.isClient())
      return;
    this.#gfx = new PIXI6.Graphics(this.#ctx);
    this.#gfx.zIndex = 9999999999;
    this.game.renderer.scene.addChild(this.#gfx);
    this.#updateHandles();
    const canvas = this.game.renderer.app.canvas;
    canvas.addEventListener("mousemove", this.#onMouseMove);
    canvas.addEventListener("mouseup", this.#onMouseUp);
  }
};

// ../engine/entity/entities/rigidbody.ts
import RAPIER3 from "@dreamlab/vendor/rapier.js";
var rigidbodyTypes = [
  "dynamic",
  "fixed"
  // "kinematic-position",
  // "kinematic-velocity",
  // TODO: Implement these nicely
];
var RigidbodyTypeAdapter = enumAdapter(rigidbodyTypes);
var Rigidbody2D = class _Rigidbody2D extends Entity {
  static {
    __name(this, "Rigidbody2D");
  }
  static {
    Entity.registerType(this, "@core");
  }
  static icon = "\u2699\uFE0F";
  get bounds() {
    return new Vector2(this.#shape.halfExtents.x * 2, this.#shape.halfExtents.y * 2);
  }
  type = "fixed";
  body;
  collider;
  #shape;
  constructor(ctx) {
    super(ctx);
    this.defineValue(_Rigidbody2D, "type", { type: RigidbodyTypeAdapter });
    this.initializeRigidBody();
    const typeValue = this.values.get("type");
    this.listen(this.game.values, ValueChanged, (event) => {
      if (event.value !== typeValue)
        return;
      this.initializeRigidBody();
    });
    this.on(EntityPreUpdate, () => {
      if (!this.game.physics.enabled)
        return;
      this.body.setTranslation(
        {
          x: this.globalTransform.position.x,
          y: this.globalTransform.position.y
        },
        false
      );
      this.body.setRotation(this.globalTransform.rotation, false);
      this.#shape.halfExtents = {
        x: this.globalTransform.scale.x / 2,
        y: this.globalTransform.scale.y / 2
      };
    });
    this.on(EntityUpdate, () => {
      if (!this.game.physics.enabled)
        return;
      this.globalTransform.position = new Vector2(this.body.translation());
      this.globalTransform.rotation = this.body.rotation();
      this.globalTransform.scale = new Vector2(
        this.#shape.halfExtents.x * 2,
        this.#shape.halfExtents.y * 2
      );
    });
    this.on(EntityDestroyed, () => {
      this.game.physics.world.removeRigidBody(this.body);
    });
  }
  initializeRigidBody() {
    if (this.body) {
      this.game.physics.world.removeRigidBody(this.body);
    }
    let desc;
    if (this.type === "dynamic")
      desc = RAPIER3.RigidBodyDesc.dynamic();
    else if (this.type === "fixed")
      desc = RAPIER3.RigidBodyDesc.fixed();
    else if (this.type === "kinematic-position")
      desc = RAPIER3.RigidBodyDesc.kinematicPositionBased();
    else if (this.type === "kinematic-velocity")
      desc = RAPIER3.RigidBodyDesc.kinematicVelocityBased();
    else
      throw new Error("invalid rigidbody type");
    desc = desc.setTranslation(this.globalTransform.position.x, this.globalTransform.position.y).setRotation(this.globalTransform.rotation);
    this.body = this.game.physics.world.createRigidBody(desc);
    this.collider = this.game.physics.world.createCollider(
      RAPIER3.ColliderDesc.cuboid(
        this.globalTransform.scale.x / 2,
        this.globalTransform.scale.y / 2
      ),
      this.body
    );
    this.collider.setActiveCollisionTypes(
      RAPIER3.ActiveCollisionTypes.DEFAULT | RAPIER3.ActiveCollisionTypes.KINEMATIC_FIXED | RAPIER3.ActiveCollisionTypes.FIXED_FIXED
    );
    this.collider.setActiveEvents(RAPIER3.ActiveEvents.COLLISION_EVENTS);
    this.#shape = this.collider.shape;
    this.game.physics.registerBody(this, this.body);
  }
};

// ../engine/entity/entities/sprite.ts
import * as PIXI7 from "@dreamlab/vendor/pixi.js";
var Sprite2D = class _Sprite2D extends PixiEntity {
  static {
    __name(this, "Sprite2D");
  }
  static {
    Entity.registerType(this, "@core");
  }
  static icon = "\u{1F5BC}\uFE0F";
  get bounds() {
    return new Vector2(this.width, this.height);
  }
  width = 1;
  height = 1;
  texture = "";
  alpha = 1;
  sprite;
  constructor(ctx) {
    super(ctx);
    this.defineValues(_Sprite2D, "width", "height", "alpha");
    this.defineValue(_Sprite2D, "texture", { type: TextureAdapter });
    if (this.texture !== "") {
      PIXI7.Assets.backgroundLoad(this.game.resolveResource(this.texture));
    }
    this.listen(this.game, GameRender, () => {
      if (!this.sprite)
        return;
      this.sprite.width = this.width * this.globalTransform.scale.x;
      this.sprite.height = this.height * this.globalTransform.scale.y;
      this.sprite.alpha = this.alpha;
    });
    const textureValue = this.values.get("texture");
    this.listen(this.game.values, ValueChanged, async (event) => {
      if (!this.sprite)
        return;
      if (event.value !== textureValue)
        return;
      const texture = await this.#getTexture();
      this.sprite.texture = texture;
    });
    this.on(EntityDestroyed, () => {
      this.sprite?.destroy();
    });
  }
  async #getTexture() {
    if (this.texture === "")
      return PIXI7.Texture.WHITE;
    const texture = await PIXI7.Assets.load(this.game.resolveResource(this.texture));
    if (!(texture instanceof PIXI7.Texture)) {
      throw new TypeError("texture is not a pixi texture");
    }
    return texture;
  }
  async onInitialize() {
    super.onInitialize();
    if (!this.container)
      return;
    const texture = await this.#getTexture();
    this.sprite = new PIXI7.Sprite({
      texture,
      width: this.width * this.globalTransform.scale.x,
      height: this.height * this.globalTransform.scale.y,
      anchor: 0.5
    });
    this.container.addChild(this.sprite);
  }
};

// ../engine/entity/entities/tiling-sprite.ts
import * as PIXI8 from "@dreamlab/vendor/pixi.js";
var TilingSprite2D = class _TilingSprite2D extends PixiEntity {
  static {
    __name(this, "TilingSprite2D");
  }
  static {
    Entity.registerType(this, "@core");
  }
  static icon = "\u{1F5BC}\uFE0F";
  get bounds() {
    return new Vector2(this.width, this.height);
  }
  width = 1;
  height = 1;
  texture = "";
  alpha = 1;
  tilePosition = Vector2.ZERO;
  tileRotation = 0;
  tileScale = Vector2.ONE;
  sprite;
  constructor(ctx) {
    super(ctx);
    this.defineValues(_TilingSprite2D, "width", "height", "alpha", "tileRotation");
    this.defineValue(_TilingSprite2D, "tilePosition", { type: Vector2Adapter });
    this.defineValue(_TilingSprite2D, "tileScale", { type: Vector2Adapter });
    this.defineValue(_TilingSprite2D, "texture", { type: TextureAdapter });
    if (this.texture !== "") {
      PIXI8.Assets.backgroundLoad(this.game.resolveResource(this.texture));
    }
    this.listen(this.game, GameRender, () => {
      if (!this.sprite)
        return;
      this.sprite.width = this.width * this.globalTransform.scale.x;
      this.sprite.height = this.height * this.globalTransform.scale.y;
      this.sprite.alpha = this.alpha;
      this.sprite.tilePosition = this.tilePosition;
      this.sprite.tileRotation = this.tileRotation;
      const texture = this.sprite.texture;
      this.sprite.tileScale = this.tileScale.div({
        x: texture.width / this.width,
        y: texture.height / this.height
      });
    });
    const textureValue = this.values.get("texture");
    this.listen(this.game.values, ValueChanged, async (event) => {
      if (!this.sprite)
        return;
      if (event.value !== textureValue)
        return;
      const texture = await this.#getTexture();
      this.sprite.texture = texture;
    });
    this.on(EntityDestroyed, () => {
      this.sprite?.destroy();
    });
  }
  async #getTexture() {
    if (this.texture === "")
      return PIXI8.Texture.WHITE;
    const texture = await PIXI8.Assets.load(this.game.resolveResource(this.texture));
    if (!(texture instanceof PIXI8.Texture)) {
      throw new TypeError("texture is not a pixi texture");
    }
    return texture;
  }
  async onInitialize() {
    super.onInitialize();
    if (!this.container)
      return;
    const texture = await this.#getTexture();
    this.sprite = new PIXI8.TilingSprite(texture);
    this.sprite.width = this.width * this.globalTransform.scale.x;
    this.sprite.height = this.height * this.globalTransform.scale.y;
    this.sprite.anchor.set(0.5);
    this.sprite.alpha = this.alpha;
    this.sprite.tilePosition = this.tilePosition;
    this.sprite.tileRotation = this.tileRotation;
    this.sprite.tileScale = this.tileScale.div({
      x: texture.width / this.width,
      y: texture.height / this.height
    });
    this.container.addChild(this.sprite);
  }
};

// ../engine/entity/entities/ui-layer.ts
var UILayer = class extends Entity {
  static {
    __name(this, "UILayer");
  }
  static {
    Entity.registerType(this, "@core");
  }
  static icon = "\u{1F5BC}\uFE0F";
  bounds;
  #ui;
  get dom() {
    if (!this.game.isClient()) {
      throw new Error("cannot access property 'root' on the server");
    }
    if (!this.#ui) {
      throw new Error(`${this.id} has not been initialized`);
    }
    return this.#ui?.root;
  }
  get element() {
    if (!this.game.isClient()) {
      throw new Error("cannot access property 'element' on the server");
    }
    if (!this.#ui) {
      throw new Error(`${this.id} has not been initialized`);
    }
    return this.#ui?.element;
  }
  constructor(ctx) {
    super(ctx);
    this.on(EntityDestroyed, () => {
      if (!this.#ui)
        return;
      this.#ui.element.remove();
      this.#ui.outer.remove();
    });
  }
  onInitialize() {
    if (!this.game.isClient())
      return;
    const [outer, root] = this.game.ui.create(this);
    const element2 = document.createElement("div");
    this.#ui = { outer, root, element: element2 };
    element2.id = "root";
    element2.style.zIndex = this.z.toString();
    const style = document.createElement("style");
    const css = `
#root {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

#root > * {
  pointer-events: auto;
}
`;
    style.appendChild(document.createTextNode(css));
    root.appendChild(style);
    root.appendChild(element2);
  }
};

// ../engine/entity/entities/ui-panel.ts
import * as PIXI9 from "@dreamlab/vendor/pixi.js";
var UIPanel = class extends Entity {
  static {
    __name(this, "UIPanel");
  }
  static {
    Entity.registerType(this, "@core");
  }
  static icon = "\u{1F5BC}\uFE0F";
  bounds;
  #ui;
  get dom() {
    if (!this.game.isClient()) {
      throw new Error("cannot access property 'root' on the server");
    }
    if (!this.#ui) {
      throw new Error(`${this.id} has not been initialized`);
    }
    return this.#ui?.root;
  }
  get element() {
    if (!this.game.isClient()) {
      throw new Error("cannot access property 'element' on the server");
    }
    if (!this.#ui) {
      throw new Error(`${this.id} has not been initialized`);
    }
    return this.#ui?.element;
  }
  constructor(ctx) {
    super(ctx);
    this.listen(this.game, GameRender, () => {
      this.#updateDiv();
    });
    this.on(EntityDestroyed, () => {
      if (!this.#ui)
        return;
      this.#ui.element.remove();
      this.#ui.outer.remove();
    });
  }
  #updateDiv() {
    if (!this.#ui)
      return;
    const { element: element2 } = this.#ui;
    const camera = Camera.getActive(this.game);
    if (!camera)
      return;
    const pos = this.interpolated.position;
    const screen = camera.worldToScreen(pos);
    element2.style.zIndex = this.z.toString();
    element2.style.left = screen.x.toString() + "px";
    element2.style.top = screen.y.toString() + "px";
    const { a, b, c, d, tx, ty } = PIXI9.Matrix.shared.identity().rotate(camera.smoothed.rotation - this.interpolated.rotation).scale(
      this.globalTransform.scale.x / camera.smoothed.scale.x,
      this.globalTransform.scale.y / camera.smoothed.scale.y
    );
    element2.style.transform = `translateX(-50%) translateY(-50%) matrix(${a}, ${b}, ${c}, ${d}, ${tx}, ${ty})`;
  }
  onInitialize() {
    if (!this.game.isClient())
      return;
    const [outer, root] = this.game.ui.create(this);
    const element2 = document.createElement("div");
    this.#ui = { outer, root, element: element2 };
    element2.style.pointerEvents = "auto";
    element2.style.position = "absolute";
    this.#updateDiv();
    root.appendChild(element2);
  }
};

// ../engine/signals/entity-updates.ts
var EntityPreUpdate = class {
  static {
    __name(this, "EntityPreUpdate");
  }
  [exclusiveSignalType] = Entity;
};
var EntityUpdate = class {
  static {
    __name(this, "EntityUpdate");
  }
  [exclusiveSignalType] = Entity;
};
var EntityTransformUpdate = class {
  static {
    __name(this, "EntityTransformUpdate");
  }
  constructor() {
  }
  [exclusiveSignalType] = Entity;
};
var EntityMove = class {
  constructor(before, current) {
    this.before = before;
    this.current = current;
  }
  static {
    __name(this, "EntityMove");
  }
  [exclusiveSignalType] = Entity;
};
var EntityResize = class {
  constructor(before, current) {
    this.before = before;
    this.current = current;
  }
  static {
    __name(this, "EntityResize");
  }
  [exclusiveSignalType] = Entity;
};
var EntityRotate = class {
  constructor(before, current) {
    this.before = before;
    this.current = current;
  }
  static {
    __name(this, "EntityRotate");
  }
  [exclusiveSignalType] = Entity;
};
var EntityZChanged = class {
  constructor(before, current) {
    this.before = before;
    this.current = current;
  }
  static {
    __name(this, "EntityZChanged");
  }
  [exclusiveSignalType] = Entity;
};
var EntityExclusiveAuthorityChanged = class {
  constructor(entity, authority, clock) {
    this.entity = entity;
    this.authority = authority;
    this.clock = clock;
  }
  static {
    __name(this, "EntityExclusiveAuthorityChanged");
  }
  [exclusiveSignalType] = BaseGame;
};

// ../engine/behavior/behavior.ts
var Behavior = class {
  static {
    __name(this, "Behavior");
  }
  game;
  entity;
  get time() {
    return this.game.time;
  }
  get inputs() {
    return this.game.inputs;
  }
  ref = generateCUID2("bhv");
  // #region Values
  #defaultValues = {};
  #values = /* @__PURE__ */ new Map();
  get values() {
    return this.#values;
  }
  defineValues(eType, ...props) {
    for (const prop of props) {
      this.value(eType, prop);
    }
  }
  value(bType, prop, opts = {}) {
    if (!(this instanceof bType))
      throw new TypeError(`${this.constructor} is not an instance of ${bType}`);
    const identifier = `${this.entity.ref}/${this.ref}/${prop}`;
    if (this.#values.has(identifier))
      throw new Error(`A value with the identifier '${identifier}' already exists!`);
    let defaultValue = this[prop];
    if (this.#defaultValues[prop])
      defaultValue = this.#defaultValues[prop];
    const value = new Value(
      this.game.values,
      identifier,
      defaultValue,
      opts.type ?? inferValueTypeTag(defaultValue),
      opts.description ?? prop
    );
    if (opts.replicated)
      value.replicated = opts.replicated;
    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      set: (v) => {
        value.value = v;
      },
      get: () => value.value
    });
    this.#values.set(prop, value);
    return value;
  }
  // #endregion
  // #region External Listeners
  listeners = [];
  listen(receiver, signalType, signalListener) {
    const boundSignalListener = signalListener.bind(this);
    receiver.on(signalType, boundSignalListener);
    this.listeners.push([
      new WeakRef(receiver),
      signalType,
      boundSignalListener
    ]);
  }
  // #endregion
  // #region Signals
  #signalListenerMap = /* @__PURE__ */ new Map();
  fire(ctor, ...args) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners)
      return;
    const signal = new ctor(...args);
    listeners.forEach((l) => l(signal));
  }
  on(type, listener) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener);
    this.#signalListenerMap.set(type, listeners);
  }
  unregister(type, listener) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners)
      return;
    const idx = listeners.indexOf(listener);
    if (idx !== -1)
      listeners.splice(idx, 1);
  }
  // #endregion
  constructor(ctx) {
    this.game = ctx.game;
    this.entity = ctx.entity;
    if (ctx.ref)
      this.ref = ctx.ref;
    if (ctx.values)
      this.#defaultValues = ctx.values;
  }
  destroy() {
    this.fire(BehaviorDestroyed);
    const idx = this.entity.behaviors.indexOf(this);
    if (idx !== -1)
      this.entity.behaviors.splice(idx);
    for (const value of this.#values.values())
      value.destroy();
    for (const [receiverRef, type, listener] of this.listeners) {
      const receiver = receiverRef.deref();
      if (!receiver)
        continue;
      receiver.unregister(type, listener);
    }
  }
  [Symbol.dispose]() {
    this.destroy();
  }
  spawn() {
    this.onInitialize();
    if (this.onTick) {
      const onTick = this.onTick.bind(this);
      this.listen(this.entity, EntityUpdate, () => {
        if (!this.game.paused)
          onTick();
      });
    }
    if (this.onPreTick) {
      const onPreTick = this.onPreTick.bind(this);
      this.listen(this.entity.game, GamePreTick, () => {
        if (!this.game.paused)
          onPreTick();
      });
    }
    if (this.onFrame) {
      const onFrame = this.onFrame.bind(this);
      this.listen(this.entity.game, GameRender, () => onFrame());
    }
    if (this.onPostTick) {
      const onPostTick = this.onPostTick.bind(this);
      this.listen(this.entity.game, GamePostTick, () => {
        if (!this.game.paused)
          onPostTick();
      });
    }
  }
  onInitialize() {
  }
};
export {
  Action,
  ActionBound,
  ActionChanged,
  ActionCreated,
  ActionDeleted,
  ActionPressed,
  ActionReleased,
  ActiveCameraChanged,
  AnimatedSprite2D,
  BaseGame,
  BasicSignalHandler,
  Behavior,
  BehaviorLoader,
  BoxResizeGizmo,
  Camera,
  Click,
  ClickableCircle,
  ClickableEntity,
  ClickableRect,
  ClientGame,
  EPSILON,
  Empty,
  Entity,
  EntityByRefAdapter,
  EntityChildDestroyed,
  EntityChildRenamed,
  EntityChildReparented,
  EntityChildSpawned,
  EntityCollision,
  EntityDescendantDestroyed,
  EntityDescendantRenamed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  EntityDestroyed,
  EntityExclusiveAuthorityChanged,
  EntityMove,
  EntityPreUpdate,
  EntityRenamed,
  EntityReparented,
  EntityResize,
  EntityRotate,
  EntitySpawned,
  EntityStore,
  EntityTransformUpdate,
  EntityUpdate,
  EntityZChanged,
  GamePostRender,
  GamePostTick,
  GamePreRender,
  GamePreTick,
  GameRender,
  GameRenderer,
  GameShutdown,
  GameStatus,
  GameStatusChange,
  GameTick,
  Gizmo,
  GizmoRotateEnd,
  GizmoRotateMove,
  GizmoRotateStart,
  GizmoScaleEnd,
  GizmoScaleMove,
  GizmoScaleStart,
  GizmoTranslateEnd,
  GizmoTranslateMove,
  GizmoTranslateStart,
  Inputs,
  LocalRoot,
  MouseDown,
  MouseOut,
  MouseOver,
  MouseUp,
  PhysicsEngine,
  PixiEntity,
  PlayerJoined,
  PlayerLeft,
  PrefabsRoot,
  RectCollider2D,
  Rigidbody2D,
  Root,
  Scroll,
  ServerGame,
  ServerRoot,
  Sprite2D,
  SpritesheetAdapter,
  TextureAdapter,
  TilingSprite2D,
  Transform,
  UILayer,
  UIPanel,
  Value,
  ValueChanged,
  ValueRegistry,
  ValueTypeAdapter,
  Vector2,
  Vector2Adapter,
  WorldRoot,
  element,
  enumAdapter,
  exclusiveSignalType,
  inferValueTypeTag,
  inputs,
  isInput,
  isValidPlainIdentifier,
  lerp,
  lerpAngle,
  lerpUnclamped,
  pointLocalToWorld,
  pointWorldToLocal,
  serializeIdentifier,
  smoothLerp,
  transformLocalToWorld,
  transformWorldToLocal
};
//# sourceMappingURL=engine.js.map
