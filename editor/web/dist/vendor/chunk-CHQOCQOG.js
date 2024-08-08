// deno polyfills for browser
Symbol.dispose ??= Symbol.for("Symbol.dispose");
Symbol.asyncDispose ??= Symbol.for("Symbol.asyncDispose");
import {
  Ticker,
  UPDATE_PRIORITY
} from "./chunk-QEDS4L63.js";
import {
  ExtensionType,
  Point,
  eventemitter3_default,
  removeItems,
  warn
} from "./chunk-NTVIR6OF.js";
import {
  __name
} from "./chunk-7BQTSFA4.js";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/events/FederatedEvent.mjs
var FederatedEvent = class _FederatedEvent {
  static {
    __name(this, "FederatedEvent");
  }
  /**
   * @param manager - The event boundary which manages this event. Propagation can only occur
   *  within the boundary's jurisdiction.
   */
  constructor(manager) {
    this.bubbles = true;
    this.cancelBubble = true;
    this.cancelable = false;
    this.composed = false;
    this.defaultPrevented = false;
    this.eventPhase = _FederatedEvent.prototype.NONE;
    this.propagationStopped = false;
    this.propagationImmediatelyStopped = false;
    this.layer = new Point();
    this.page = new Point();
    this.NONE = 0;
    this.CAPTURING_PHASE = 1;
    this.AT_TARGET = 2;
    this.BUBBLING_PHASE = 3;
    this.manager = manager;
  }
  /** @readonly */
  get layerX() {
    return this.layer.x;
  }
  /** @readonly */
  get layerY() {
    return this.layer.y;
  }
  /** @readonly */
  get pageX() {
    return this.page.x;
  }
  /** @readonly */
  get pageY() {
    return this.page.y;
  }
  /**
   * Fallback for the deprecated @code{InteractionEvent.data}.
   * @deprecated since 7.0.0
   */
  get data() {
    return this;
  }
  /** The propagation path for this event. Alias for {@link EventBoundary.propagationPath}. */
  composedPath() {
    if (this.manager && (!this.path || this.path[this.path.length - 1] !== this.target)) {
      this.path = this.target ? this.manager.propagationPath(this.target) : [];
    }
    return this.path;
  }
  /**
   * Unimplemented method included for implementing the DOM interface {@code Event}. It will throw an {@code Error}.
   * @deprecated
   * @param _type
   * @param _bubbles
   * @param _cancelable
   */
  initEvent(_type, _bubbles, _cancelable) {
    throw new Error("initEvent() is a legacy DOM API. It is not implemented in the Federated Events API.");
  }
  /**
   * Unimplemented method included for implementing the DOM interface {@code UIEvent}. It will throw an {@code Error}.
   * @deprecated
   * @param _typeArg
   * @param _bubblesArg
   * @param _cancelableArg
   * @param _viewArg
   * @param _detailArg
   */
  initUIEvent(_typeArg, _bubblesArg, _cancelableArg, _viewArg, _detailArg) {
    throw new Error("initUIEvent() is a legacy DOM API. It is not implemented in the Federated Events API.");
  }
  /** Prevent default behavior of PixiJS and the user agent. */
  preventDefault() {
    if (this.nativeEvent instanceof Event && this.nativeEvent.cancelable) {
      this.nativeEvent.preventDefault();
    }
    this.defaultPrevented = true;
  }
  /**
   * Stop this event from propagating to any addition listeners, including on the
   * {@link FederatedEventTarget.currentTarget currentTarget} and also the following
   * event targets on the propagation path.
   */
  stopImmediatePropagation() {
    this.propagationImmediatelyStopped = true;
  }
  /**
   * Stop this event from propagating to the next {@link FederatedEventTarget}. The rest of the listeners
   * on the {@link FederatedEventTarget.currentTarget currentTarget} will still be notified.
   */
  stopPropagation() {
    this.propagationStopped = true;
  }
};

// ../../../../../.cache/deno/deno_esbuild/ismobilejs@1.1.1/node_modules/ismobilejs/esm/isMobile.js
var appleIphone = /iPhone/i;
var appleIpod = /iPod/i;
var appleTablet = /iPad/i;
var appleUniversal = /\biOS-universal(?:.+)Mac\b/i;
var androidPhone = /\bAndroid(?:.+)Mobile\b/i;
var androidTablet = /Android/i;
var amazonPhone = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i;
var amazonTablet = /Silk/i;
var windowsPhone = /Windows Phone/i;
var windowsTablet = /\bWindows(?:.+)ARM\b/i;
var otherBlackBerry = /BlackBerry/i;
var otherBlackBerry10 = /BB10/i;
var otherOpera = /Opera Mini/i;
var otherChrome = /\b(CriOS|Chrome)(?:.+)Mobile/i;
var otherFirefox = /Mobile(?:.+)Firefox\b/i;
var isAppleTabletOnIos13 = /* @__PURE__ */ __name(function(navigator2) {
  return typeof navigator2 !== "undefined" && navigator2.platform === "MacIntel" && typeof navigator2.maxTouchPoints === "number" && navigator2.maxTouchPoints > 1 && typeof MSStream === "undefined";
}, "isAppleTabletOnIos13");
function createMatch(userAgent) {
  return function(regex) {
    return regex.test(userAgent);
  };
}
__name(createMatch, "createMatch");
function isMobile(param) {
  var nav = {
    userAgent: "",
    platform: "",
    maxTouchPoints: 0
  };
  if (!param && typeof navigator !== "undefined") {
    nav = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints || 0
    };
  } else if (typeof param === "string") {
    nav.userAgent = param;
  } else if (param && param.userAgent) {
    nav = {
      userAgent: param.userAgent,
      platform: param.platform,
      maxTouchPoints: param.maxTouchPoints || 0
    };
  }
  var userAgent = nav.userAgent;
  var tmp = userAgent.split("[FBAN");
  if (typeof tmp[1] !== "undefined") {
    userAgent = tmp[0];
  }
  tmp = userAgent.split("Twitter");
  if (typeof tmp[1] !== "undefined") {
    userAgent = tmp[0];
  }
  var match = createMatch(userAgent);
  var result = {
    apple: {
      phone: match(appleIphone) && !match(windowsPhone),
      ipod: match(appleIpod),
      tablet: !match(appleIphone) && (match(appleTablet) || isAppleTabletOnIos13(nav)) && !match(windowsPhone),
      universal: match(appleUniversal),
      device: (match(appleIphone) || match(appleIpod) || match(appleTablet) || match(appleUniversal) || isAppleTabletOnIos13(nav)) && !match(windowsPhone)
    },
    amazon: {
      phone: match(amazonPhone),
      tablet: !match(amazonPhone) && match(amazonTablet),
      device: match(amazonPhone) || match(amazonTablet)
    },
    android: {
      phone: !match(windowsPhone) && match(amazonPhone) || !match(windowsPhone) && match(androidPhone),
      tablet: !match(windowsPhone) && !match(amazonPhone) && !match(androidPhone) && (match(amazonTablet) || match(androidTablet)),
      device: !match(windowsPhone) && (match(amazonPhone) || match(amazonTablet) || match(androidPhone) || match(androidTablet)) || match(/\bokhttp\b/i)
    },
    windows: {
      phone: match(windowsPhone),
      tablet: match(windowsTablet),
      device: match(windowsPhone) || match(windowsTablet)
    },
    other: {
      blackberry: match(otherBlackBerry),
      blackberry10: match(otherBlackBerry10),
      opera: match(otherOpera),
      firefox: match(otherFirefox),
      chrome: match(otherChrome),
      device: match(otherBlackBerry) || match(otherBlackBerry10) || match(otherOpera) || match(otherFirefox) || match(otherChrome)
    },
    any: false,
    phone: false,
    tablet: false
  };
  result.any = result.apple.device || result.android.device || result.windows.device || result.other.device;
  result.phone = result.apple.phone || result.android.phone || result.windows.phone;
  result.tablet = result.apple.tablet || result.android.tablet || result.windows.tablet;
  return result;
}
__name(isMobile, "isMobile");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/utils/browser/isMobile.mjs
var isMobileCall = isMobile.default ?? isMobile;
var isMobile2 = isMobileCall(globalThis.navigator);

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/accessibility/AccessibilitySystem.mjs
var KEY_CODE_TAB = 9;
var DIV_TOUCH_SIZE = 100;
var DIV_TOUCH_POS_X = 0;
var DIV_TOUCH_POS_Y = 0;
var DIV_TOUCH_ZINDEX = 2;
var DIV_HOOK_SIZE = 1;
var DIV_HOOK_POS_X = -1e3;
var DIV_HOOK_POS_Y = -1e3;
var DIV_HOOK_ZINDEX = 2;
var AccessibilitySystem = class {
  static {
    __name(this, "AccessibilitySystem");
  }
  // 2fps
  // eslint-disable-next-line jsdoc/require-param
  /**
   * @param {WebGLRenderer|WebGPURenderer} renderer - A reference to the current renderer
   */
  constructor(renderer, _mobileInfo = isMobile2) {
    this._mobileInfo = _mobileInfo;
    this.debug = false;
    this._isActive = false;
    this._isMobileAccessibility = false;
    this._pool = [];
    this._renderId = 0;
    this._children = [];
    this._androidUpdateCount = 0;
    this._androidUpdateFrequency = 500;
    this._hookDiv = null;
    if (_mobileInfo.tablet || _mobileInfo.phone) {
      this._createTouchHook();
    }
    const div = document.createElement("div");
    div.style.width = `${DIV_TOUCH_SIZE}px`;
    div.style.height = `${DIV_TOUCH_SIZE}px`;
    div.style.position = "absolute";
    div.style.top = `${DIV_TOUCH_POS_X}px`;
    div.style.left = `${DIV_TOUCH_POS_Y}px`;
    div.style.zIndex = DIV_TOUCH_ZINDEX.toString();
    this._div = div;
    this._renderer = renderer;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    globalThis.addEventListener("keydown", this._onKeyDown, false);
  }
  /**
   * Value of `true` if accessibility is currently active and accessibility layers are showing.
   * @member {boolean}
   * @readonly
   */
  get isActive() {
    return this._isActive;
  }
  /**
   * Value of `true` if accessibility is enabled for touch devices.
   * @member {boolean}
   * @readonly
   */
  get isMobileAccessibility() {
    return this._isMobileAccessibility;
  }
  get hookDiv() {
    return this._hookDiv;
  }
  /**
   * Creates the touch hooks.
   * @private
   */
  _createTouchHook() {
    const hookDiv = document.createElement("button");
    hookDiv.style.width = `${DIV_HOOK_SIZE}px`;
    hookDiv.style.height = `${DIV_HOOK_SIZE}px`;
    hookDiv.style.position = "absolute";
    hookDiv.style.top = `${DIV_HOOK_POS_X}px`;
    hookDiv.style.left = `${DIV_HOOK_POS_Y}px`;
    hookDiv.style.zIndex = DIV_HOOK_ZINDEX.toString();
    hookDiv.style.backgroundColor = "#FF0000";
    hookDiv.title = "select to enable accessibility for this content";
    hookDiv.addEventListener("focus", () => {
      this._isMobileAccessibility = true;
      this._activate();
      this._destroyTouchHook();
    });
    document.body.appendChild(hookDiv);
    this._hookDiv = hookDiv;
  }
  /**
   * Destroys the touch hooks.
   * @private
   */
  _destroyTouchHook() {
    if (!this._hookDiv) {
      return;
    }
    document.body.removeChild(this._hookDiv);
    this._hookDiv = null;
  }
  /**
   * Activating will cause the Accessibility layer to be shown.
   * This is called when a user presses the tab key.
   * @private
   */
  _activate() {
    if (this._isActive) {
      return;
    }
    this._isActive = true;
    globalThis.document.addEventListener("mousemove", this._onMouseMove, true);
    globalThis.removeEventListener("keydown", this._onKeyDown, false);
    this._renderer.runners.postrender.add(this);
    this._renderer.view.canvas.parentNode?.appendChild(this._div);
  }
  /**
   * Deactivating will cause the Accessibility layer to be hidden.
   * This is called when a user moves the mouse.
   * @private
   */
  _deactivate() {
    if (!this._isActive || this._isMobileAccessibility) {
      return;
    }
    this._isActive = false;
    globalThis.document.removeEventListener("mousemove", this._onMouseMove, true);
    globalThis.addEventListener("keydown", this._onKeyDown, false);
    this._renderer.runners.postrender.remove(this);
    this._div.parentNode?.removeChild(this._div);
  }
  /**
   * This recursive function will run through the scene graph and add any new accessible objects to the DOM layer.
   * @private
   * @param {Container} container - The Container to check.
   */
  _updateAccessibleObjects(container) {
    if (!container.visible || !container.accessibleChildren) {
      return;
    }
    if (container.accessible && container.isInteractive()) {
      if (!container._accessibleActive) {
        this._addChild(container);
      }
      container._renderId = this._renderId;
    }
    const children = container.children;
    if (children) {
      for (let i = 0; i < children.length; i++) {
        this._updateAccessibleObjects(children[i]);
      }
    }
  }
  /**
   * Runner init called, view is available at this point.
   * @ignore
   */
  init(options) {
    this.debug = options?.debug ?? this.debug;
    this._renderer.runners.postrender.remove(this);
  }
  /**
   * Runner postrender was called, ensure that all divs are mapped correctly to their Containers.
   * Only fires while active.
   * @ignore
   */
  postrender() {
    const now = performance.now();
    if (this._mobileInfo.android.device && now < this._androidUpdateCount) {
      return;
    }
    this._androidUpdateCount = now + this._androidUpdateFrequency;
    if (!this._renderer.renderingToScreen || !this._renderer.view.canvas) {
      return;
    }
    if (this._renderer.lastObjectRendered) {
      this._updateAccessibleObjects(this._renderer.lastObjectRendered);
    }
    const { x, y, width, height } = this._renderer.view.canvas.getBoundingClientRect();
    const { width: viewWidth, height: viewHeight, resolution } = this._renderer;
    const sx = width / viewWidth * resolution;
    const sy = height / viewHeight * resolution;
    let div = this._div;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    div.style.width = `${viewWidth}px`;
    div.style.height = `${viewHeight}px`;
    for (let i = 0; i < this._children.length; i++) {
      const child = this._children[i];
      if (child._renderId !== this._renderId) {
        child._accessibleActive = false;
        removeItems(this._children, i, 1);
        this._div.removeChild(child._accessibleDiv);
        this._pool.push(child._accessibleDiv);
        child._accessibleDiv = null;
        i--;
      } else {
        div = child._accessibleDiv;
        let hitArea = child.hitArea;
        const wt = child.worldTransform;
        if (child.hitArea) {
          div.style.left = `${(wt.tx + hitArea.x * wt.a) * sx}px`;
          div.style.top = `${(wt.ty + hitArea.y * wt.d) * sy}px`;
          div.style.width = `${hitArea.width * wt.a * sx}px`;
          div.style.height = `${hitArea.height * wt.d * sy}px`;
        } else {
          hitArea = child.getBounds().rectangle;
          this._capHitArea(hitArea);
          div.style.left = `${hitArea.x * sx}px`;
          div.style.top = `${hitArea.y * sy}px`;
          div.style.width = `${hitArea.width * sx}px`;
          div.style.height = `${hitArea.height * sy}px`;
          if (div.title !== child.accessibleTitle && child.accessibleTitle !== null) {
            div.title = child.accessibleTitle || "";
          }
          if (div.getAttribute("aria-label") !== child.accessibleHint && child.accessibleHint !== null) {
            div.setAttribute("aria-label", child.accessibleHint || "");
          }
        }
        if (child.accessibleTitle !== div.title || child.tabIndex !== div.tabIndex) {
          div.title = child.accessibleTitle || "";
          div.tabIndex = child.tabIndex;
          if (this.debug) {
            this._updateDebugHTML(div);
          }
        }
      }
    }
    this._renderId++;
  }
  /**
   * private function that will visually add the information to the
   * accessibility div
   * @param {HTMLElement} div -
   */
  _updateDebugHTML(div) {
    div.innerHTML = `type: ${div.type}</br> title : ${div.title}</br> tabIndex: ${div.tabIndex}`;
  }
  /**
   * Adjust the hit area based on the bounds of a display object
   * @param {Rectangle} hitArea - Bounds of the child
   */
  _capHitArea(hitArea) {
    if (hitArea.x < 0) {
      hitArea.width += hitArea.x;
      hitArea.x = 0;
    }
    if (hitArea.y < 0) {
      hitArea.height += hitArea.y;
      hitArea.y = 0;
    }
    const { width: viewWidth, height: viewHeight } = this._renderer;
    if (hitArea.x + hitArea.width > viewWidth) {
      hitArea.width = viewWidth - hitArea.x;
    }
    if (hitArea.y + hitArea.height > viewHeight) {
      hitArea.height = viewHeight - hitArea.y;
    }
  }
  /**
   * Adds a Container to the accessibility manager
   * @private
   * @param {Container} container - The child to make accessible.
   */
  _addChild(container) {
    let div = this._pool.pop();
    if (!div) {
      div = document.createElement("button");
      div.style.width = `${DIV_TOUCH_SIZE}px`;
      div.style.height = `${DIV_TOUCH_SIZE}px`;
      div.style.backgroundColor = this.debug ? "rgba(255,255,255,0.5)" : "transparent";
      div.style.position = "absolute";
      div.style.zIndex = DIV_TOUCH_ZINDEX.toString();
      div.style.borderStyle = "none";
      if (navigator.userAgent.toLowerCase().includes("chrome")) {
        div.setAttribute("aria-live", "off");
      } else {
        div.setAttribute("aria-live", "polite");
      }
      if (navigator.userAgent.match(/rv:.*Gecko\//)) {
        div.setAttribute("aria-relevant", "additions");
      } else {
        div.setAttribute("aria-relevant", "text");
      }
      div.addEventListener("click", this._onClick.bind(this));
      div.addEventListener("focus", this._onFocus.bind(this));
      div.addEventListener("focusout", this._onFocusOut.bind(this));
    }
    div.style.pointerEvents = container.accessiblePointerEvents;
    div.type = container.accessibleType;
    if (container.accessibleTitle && container.accessibleTitle !== null) {
      div.title = container.accessibleTitle;
    } else if (!container.accessibleHint || container.accessibleHint === null) {
      div.title = `container ${container.tabIndex}`;
    }
    if (container.accessibleHint && container.accessibleHint !== null) {
      div.setAttribute("aria-label", container.accessibleHint);
    }
    if (this.debug) {
      this._updateDebugHTML(div);
    }
    container._accessibleActive = true;
    container._accessibleDiv = div;
    div.container = container;
    this._children.push(container);
    this._div.appendChild(container._accessibleDiv);
    container._accessibleDiv.tabIndex = container.tabIndex;
  }
  /**
   * Dispatch events with the EventSystem.
   * @param e
   * @param type
   * @private
   */
  _dispatchEvent(e, type) {
    const { container: target } = e.target;
    const boundary = this._renderer.events.rootBoundary;
    const event = Object.assign(new FederatedEvent(boundary), { target });
    boundary.rootTarget = this._renderer.lastObjectRendered;
    type.forEach((type2) => boundary.dispatchEvent(event, type2));
  }
  /**
   * Maps the div button press to pixi's EventSystem (click)
   * @private
   * @param {MouseEvent} e - The click event.
   */
  _onClick(e) {
    this._dispatchEvent(e, ["click", "pointertap", "tap"]);
  }
  /**
   * Maps the div focus events to pixi's EventSystem (mouseover)
   * @private
   * @param {FocusEvent} e - The focus event.
   */
  _onFocus(e) {
    if (!e.target.getAttribute("aria-live")) {
      e.target.setAttribute("aria-live", "assertive");
    }
    this._dispatchEvent(e, ["mouseover"]);
  }
  /**
   * Maps the div focus events to pixi's EventSystem (mouseout)
   * @private
   * @param {FocusEvent} e - The focusout event.
   */
  _onFocusOut(e) {
    if (!e.target.getAttribute("aria-live")) {
      e.target.setAttribute("aria-live", "polite");
    }
    this._dispatchEvent(e, ["mouseout"]);
  }
  /**
   * Is called when a key is pressed
   * @private
   * @param {KeyboardEvent} e - The keydown event.
   */
  _onKeyDown(e) {
    if (e.keyCode !== KEY_CODE_TAB) {
      return;
    }
    this._activate();
  }
  /**
   * Is called when the mouse moves across the renderer element
   * @private
   * @param {MouseEvent} e - The mouse event.
   */
  _onMouseMove(e) {
    if (e.movementX === 0 && e.movementY === 0) {
      return;
    }
    this._deactivate();
  }
  /** Destroys the accessibility manager */
  destroy() {
    this._destroyTouchHook();
    this._div = null;
    globalThis.document.removeEventListener("mousemove", this._onMouseMove, true);
    globalThis.removeEventListener("keydown", this._onKeyDown);
    this._pool = null;
    this._children = null;
    this._renderer = null;
  }
};
AccessibilitySystem.extension = {
  type: [
    ExtensionType.WebGLSystem,
    ExtensionType.WebGPUSystem
  ],
  name: "accessibility"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/accessibility/accessibilityTarget.mjs
var accessibilityTarget = {
  /**
   * Flag for if the object is accessible. If true AccessibilityManager will overlay a
   * shadow div with attributes set
   * @member {boolean}
   * @memberof scene.Container#
   */
  accessible: false,
  /**
   * Sets the title attribute of the shadow div
   * If accessibleTitle AND accessibleHint has not been this will default to 'container [tabIndex]'
   * @member {string}
   * @memberof scene.Container#
   */
  accessibleTitle: null,
  /**
   * Sets the aria-label attribute of the shadow div
   * @member {string}
   * @memberof scene.Container#
   */
  accessibleHint: null,
  /**
   * @member {number}
   * @memberof scene.Container#
   * @todo Needs docs.
   */
  tabIndex: 0,
  /**
   * @member {boolean}
   * @memberof scene.Container#
   * @private
   */
  _accessibleActive: false,
  /**
   * @memberof scene.Container#
   * @private
   */
  _accessibleDiv: null,
  /**
   * Specify the type of div the accessible layer is. Screen readers treat the element differently
   * depending on this type. Defaults to button.
   * @member {string}
   * @memberof scene.Container#
   * @default 'button'
   */
  accessibleType: "button",
  /**
   * Specify the pointer-events the accessible div will use
   * Defaults to auto.
   * @type {PointerEvents}
   * @memberof scene.Container#
   * @default 'auto'
   */
  accessiblePointerEvents: "auto",
  /**
   * Setting to false will prevent any children inside this container to
   * be accessible. Defaults to true.
   * @member {boolean}
   * @memberof scene.Container#
   * @default true
   */
  accessibleChildren: true,
  /**
   * @member {number}
   * @memberof scene.Container#
   * @private
   */
  _renderId: -1
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/events/EventTicker.mjs
var EventsTickerClass = class {
  static {
    __name(this, "EventsTickerClass");
  }
  constructor() {
    this.interactionFrequency = 10;
    this._deltaTime = 0;
    this._didMove = false;
    this._tickerAdded = false;
    this._pauseUpdate = true;
  }
  /**
   * Initializes the event ticker.
   * @param events - The event system.
   */
  init(events) {
    this.removeTickerListener();
    this.events = events;
    this.interactionFrequency = 10;
    this._deltaTime = 0;
    this._didMove = false;
    this._tickerAdded = false;
    this._pauseUpdate = true;
  }
  /** Whether to pause the update checks or not. */
  get pauseUpdate() {
    return this._pauseUpdate;
  }
  set pauseUpdate(paused) {
    this._pauseUpdate = paused;
  }
  /** Adds the ticker listener. */
  addTickerListener() {
    if (this._tickerAdded || !this.domElement) {
      return;
    }
    Ticker.system.add(this._tickerUpdate, this, UPDATE_PRIORITY.INTERACTION);
    this._tickerAdded = true;
  }
  /** Removes the ticker listener. */
  removeTickerListener() {
    if (!this._tickerAdded) {
      return;
    }
    Ticker.system.remove(this._tickerUpdate, this);
    this._tickerAdded = false;
  }
  /** Sets flag to not fire extra events when the user has already moved there mouse */
  pointerMoved() {
    this._didMove = true;
  }
  /** Updates the state of interactive objects. */
  _update() {
    if (!this.domElement || this._pauseUpdate) {
      return;
    }
    if (this._didMove) {
      this._didMove = false;
      return;
    }
    const rootPointerEvent = this.events["_rootPointerEvent"];
    if (this.events.supportsTouchEvents && rootPointerEvent.pointerType === "touch") {
      return;
    }
    globalThis.document.dispatchEvent(new PointerEvent("pointermove", {
      clientX: rootPointerEvent.clientX,
      clientY: rootPointerEvent.clientY,
      pointerType: rootPointerEvent.pointerType,
      pointerId: rootPointerEvent.pointerId
    }));
  }
  /**
   * Updates the state of interactive objects if at least {@link interactionFrequency}
   * milliseconds have passed since the last invocation.
   *
   * Invoked by a throttled ticker update from {@link Ticker.system}.
   * @param ticker - The throttled ticker.
   */
  _tickerUpdate(ticker) {
    this._deltaTime += ticker.deltaTime;
    if (this._deltaTime < this.interactionFrequency) {
      return;
    }
    this._deltaTime = 0;
    this._update();
  }
};
var EventsTicker = new EventsTickerClass();

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/events/FederatedMouseEvent.mjs
var FederatedMouseEvent = class extends FederatedEvent {
  static {
    __name(this, "FederatedMouseEvent");
  }
  constructor() {
    super(...arguments);
    this.client = new Point();
    this.movement = new Point();
    this.offset = new Point();
    this.global = new Point();
    this.screen = new Point();
  }
  /** @readonly */
  get clientX() {
    return this.client.x;
  }
  /** @readonly */
  get clientY() {
    return this.client.y;
  }
  /**
   * Alias for {@link FederatedMouseEvent.clientX this.clientX}.
   * @readonly
   */
  get x() {
    return this.clientX;
  }
  /**
   * Alias for {@link FederatedMouseEvent.clientY this.clientY}.
   * @readonly
   */
  get y() {
    return this.clientY;
  }
  /** @readonly */
  get movementX() {
    return this.movement.x;
  }
  /** @readonly */
  get movementY() {
    return this.movement.y;
  }
  /** @readonly */
  get offsetX() {
    return this.offset.x;
  }
  /** @readonly */
  get offsetY() {
    return this.offset.y;
  }
  /** @readonly */
  get globalX() {
    return this.global.x;
  }
  /** @readonly */
  get globalY() {
    return this.global.y;
  }
  /**
   * The pointer coordinates in the renderer's screen. Alias for {@code screen.x}.
   * @readonly
   */
  get screenX() {
    return this.screen.x;
  }
  /**
   * The pointer coordinates in the renderer's screen. Alias for {@code screen.y}.
   * @readonly
   */
  get screenY() {
    return this.screen.y;
  }
  /**
   * This will return the local coordinates of the specified container for this InteractionData
   * @param {Container} container - The Container that you would like the local
   *  coords off
   * @param {PointData} point - A Point object in which to store the value, optional (otherwise
   *  will create a new point)
   * @param {PointData} globalPos - A Point object containing your custom global coords, optional
   *  (otherwise will use the current global coords)
   * @returns - A point containing the coordinates of the InteractionData position relative
   *  to the Container
   */
  getLocalPosition(container, point, globalPos) {
    return container.worldTransform.applyInverse(globalPos || this.global, point);
  }
  /**
   * Whether the modifier key was pressed when this event natively occurred.
   * @param key - The modifier key.
   */
  getModifierState(key) {
    return "getModifierState" in this.nativeEvent && this.nativeEvent.getModifierState(key);
  }
  /**
   * Not supported.
   * @param _typeArg
   * @param _canBubbleArg
   * @param _cancelableArg
   * @param _viewArg
   * @param _detailArg
   * @param _screenXArg
   * @param _screenYArg
   * @param _clientXArg
   * @param _clientYArg
   * @param _ctrlKeyArg
   * @param _altKeyArg
   * @param _shiftKeyArg
   * @param _metaKeyArg
   * @param _buttonArg
   * @param _relatedTargetArg
   * @deprecated since 7.0.0
   */
  // eslint-disable-next-line max-params
  initMouseEvent(_typeArg, _canBubbleArg, _cancelableArg, _viewArg, _detailArg, _screenXArg, _screenYArg, _clientXArg, _clientYArg, _ctrlKeyArg, _altKeyArg, _shiftKeyArg, _metaKeyArg, _buttonArg, _relatedTargetArg) {
    throw new Error("Method not implemented.");
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/events/FederatedPointerEvent.mjs
var FederatedPointerEvent = class extends FederatedMouseEvent {
  static {
    __name(this, "FederatedPointerEvent");
  }
  constructor() {
    super(...arguments);
    this.width = 0;
    this.height = 0;
    this.isPrimary = false;
  }
  // Only included for completeness for now
  getCoalescedEvents() {
    if (this.type === "pointermove" || this.type === "mousemove" || this.type === "touchmove") {
      return [this];
    }
    return [];
  }
  // Only included for completeness for now
  getPredictedEvents() {
    throw new Error("getPredictedEvents is not supported!");
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/events/FederatedWheelEvent.mjs
var FederatedWheelEvent = class extends FederatedMouseEvent {
  static {
    __name(this, "FederatedWheelEvent");
  }
  constructor() {
    super(...arguments);
    this.DOM_DELTA_PIXEL = 0;
    this.DOM_DELTA_LINE = 1;
    this.DOM_DELTA_PAGE = 2;
  }
};
FederatedWheelEvent.DOM_DELTA_PIXEL = 0;
FederatedWheelEvent.DOM_DELTA_LINE = 1;
FederatedWheelEvent.DOM_DELTA_PAGE = 2;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/events/EventBoundary.mjs
var PROPAGATION_LIMIT = 2048;
var tempHitLocation = new Point();
var tempLocalMapping = new Point();
var EventBoundary = class {
  static {
    __name(this, "EventBoundary");
  }
  /**
   * @param rootTarget - The holder of the event boundary.
   */
  constructor(rootTarget) {
    this.dispatch = new eventemitter3_default();
    this.moveOnAll = false;
    this.enableGlobalMoveEvents = true;
    this.mappingState = {
      trackingData: {}
    };
    this.eventPool = /* @__PURE__ */ new Map();
    this._allInteractiveElements = [];
    this._hitElements = [];
    this._isPointerMoveEvent = false;
    this.rootTarget = rootTarget;
    this.hitPruneFn = this.hitPruneFn.bind(this);
    this.hitTestFn = this.hitTestFn.bind(this);
    this.mapPointerDown = this.mapPointerDown.bind(this);
    this.mapPointerMove = this.mapPointerMove.bind(this);
    this.mapPointerOut = this.mapPointerOut.bind(this);
    this.mapPointerOver = this.mapPointerOver.bind(this);
    this.mapPointerUp = this.mapPointerUp.bind(this);
    this.mapPointerUpOutside = this.mapPointerUpOutside.bind(this);
    this.mapWheel = this.mapWheel.bind(this);
    this.mappingTable = {};
    this.addEventMapping("pointerdown", this.mapPointerDown);
    this.addEventMapping("pointermove", this.mapPointerMove);
    this.addEventMapping("pointerout", this.mapPointerOut);
    this.addEventMapping("pointerleave", this.mapPointerOut);
    this.addEventMapping("pointerover", this.mapPointerOver);
    this.addEventMapping("pointerup", this.mapPointerUp);
    this.addEventMapping("pointerupoutside", this.mapPointerUpOutside);
    this.addEventMapping("wheel", this.mapWheel);
  }
  /**
   * Adds an event mapping for the event `type` handled by `fn`.
   *
   * Event mappings can be used to implement additional or custom events. They take an event
   * coming from the upstream scene (or directly from the {@link EventSystem}) and dispatch new downstream events
   * generally trickling down and bubbling up to {@link EventBoundary.rootTarget this.rootTarget}.
   *
   * To modify the semantics of existing events, the built-in mapping methods of EventBoundary should be overridden
   * instead.
   * @param type - The type of upstream event to map.
   * @param fn - The mapping method. The context of this function must be bound manually, if desired.
   */
  addEventMapping(type, fn) {
    if (!this.mappingTable[type]) {
      this.mappingTable[type] = [];
    }
    this.mappingTable[type].push({
      fn,
      priority: 0
    });
    this.mappingTable[type].sort((a, b) => a.priority - b.priority);
  }
  /**
   * Dispatches the given event
   * @param e - The event to dispatch.
   * @param type - The type of event to dispatch. Defaults to `e.type`.
   */
  dispatchEvent(e, type) {
    e.propagationStopped = false;
    e.propagationImmediatelyStopped = false;
    this.propagate(e, type);
    this.dispatch.emit(type || e.type, e);
  }
  /**
   * Maps the given upstream event through the event boundary and propagates it downstream.
   * @param e - The event to map.
   */
  mapEvent(e) {
    if (!this.rootTarget) {
      return;
    }
    const mappers = this.mappingTable[e.type];
    if (mappers) {
      for (let i = 0, j = mappers.length; i < j; i++) {
        mappers[i].fn(e);
      }
    } else {
      warn(`[EventBoundary]: Event mapping not defined for ${e.type}`);
    }
  }
  /**
   * Finds the Container that is the target of a event at the given coordinates.
   *
   * The passed (x,y) coordinates are in the world space above this event boundary.
   * @param x - The x coordinate of the event.
   * @param y - The y coordinate of the event.
   */
  hitTest(x, y) {
    EventsTicker.pauseUpdate = true;
    const useMove = this._isPointerMoveEvent && this.enableGlobalMoveEvents;
    const fn = useMove ? "hitTestMoveRecursive" : "hitTestRecursive";
    const invertedPath = this[fn](
      this.rootTarget,
      this.rootTarget.eventMode,
      tempHitLocation.set(x, y),
      this.hitTestFn,
      this.hitPruneFn
    );
    return invertedPath && invertedPath[0];
  }
  /**
   * Propagate the passed event from from {@link EventBoundary.rootTarget this.rootTarget} to its
   * target {@code e.target}.
   * @param e - The event to propagate.
   * @param type - The type of event to propagate. Defaults to `e.type`.
   */
  propagate(e, type) {
    if (!e.target) {
      return;
    }
    const composedPath = e.composedPath();
    e.eventPhase = e.CAPTURING_PHASE;
    for (let i = 0, j = composedPath.length - 1; i < j; i++) {
      e.currentTarget = composedPath[i];
      this.notifyTarget(e, type);
      if (e.propagationStopped || e.propagationImmediatelyStopped)
        return;
    }
    e.eventPhase = e.AT_TARGET;
    e.currentTarget = e.target;
    this.notifyTarget(e, type);
    if (e.propagationStopped || e.propagationImmediatelyStopped)
      return;
    e.eventPhase = e.BUBBLING_PHASE;
    for (let i = composedPath.length - 2; i >= 0; i--) {
      e.currentTarget = composedPath[i];
      this.notifyTarget(e, type);
      if (e.propagationStopped || e.propagationImmediatelyStopped)
        return;
    }
  }
  /**
   * Emits the event {@code e} to all interactive containers. The event is propagated in the bubbling phase always.
   *
   * This is used in the `globalpointermove` event.
   * @param e - The emitted event.
   * @param type - The listeners to notify.
   * @param targets - The targets to notify.
   */
  all(e, type, targets = this._allInteractiveElements) {
    if (targets.length === 0)
      return;
    e.eventPhase = e.BUBBLING_PHASE;
    const events = Array.isArray(type) ? type : [type];
    for (let i = targets.length - 1; i >= 0; i--) {
      events.forEach((event) => {
        e.currentTarget = targets[i];
        this.notifyTarget(e, event);
      });
    }
  }
  /**
   * Finds the propagation path from {@link EventBoundary.rootTarget rootTarget} to the passed
   * {@code target}. The last element in the path is {@code target}.
   * @param target - The target to find the propagation path to.
   */
  propagationPath(target) {
    const propagationPath = [target];
    for (let i = 0; i < PROPAGATION_LIMIT && (target !== this.rootTarget && target.parent); i++) {
      if (!target.parent) {
        throw new Error("Cannot find propagation path to disconnected target");
      }
      propagationPath.push(target.parent);
      target = target.parent;
    }
    propagationPath.reverse();
    return propagationPath;
  }
  hitTestMoveRecursive(currentTarget, eventMode, location, testFn, pruneFn, ignore = false) {
    let shouldReturn = false;
    if (this._interactivePrune(currentTarget))
      return null;
    if (currentTarget.eventMode === "dynamic" || eventMode === "dynamic") {
      EventsTicker.pauseUpdate = false;
    }
    if (currentTarget.interactiveChildren && currentTarget.children) {
      const children = currentTarget.children;
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        const nestedHit = this.hitTestMoveRecursive(
          child,
          this._isInteractive(eventMode) ? eventMode : child.eventMode,
          location,
          testFn,
          pruneFn,
          ignore || pruneFn(currentTarget, location)
        );
        if (nestedHit) {
          if (nestedHit.length > 0 && !nestedHit[nestedHit.length - 1].parent) {
            continue;
          }
          const isInteractive = currentTarget.isInteractive();
          if (nestedHit.length > 0 || isInteractive) {
            if (isInteractive)
              this._allInteractiveElements.push(currentTarget);
            nestedHit.push(currentTarget);
          }
          if (this._hitElements.length === 0)
            this._hitElements = nestedHit;
          shouldReturn = true;
        }
      }
    }
    const isInteractiveMode = this._isInteractive(eventMode);
    const isInteractiveTarget = currentTarget.isInteractive();
    if (isInteractiveTarget && isInteractiveTarget)
      this._allInteractiveElements.push(currentTarget);
    if (ignore || this._hitElements.length > 0)
      return null;
    if (shouldReturn)
      return this._hitElements;
    if (isInteractiveMode && (!pruneFn(currentTarget, location) && testFn(currentTarget, location))) {
      return isInteractiveTarget ? [currentTarget] : [];
    }
    return null;
  }
  /**
   * Recursive implementation for {@link EventBoundary.hitTest hitTest}.
   * @param currentTarget - The Container that is to be hit tested.
   * @param eventMode - The event mode for the `currentTarget` or one of its parents.
   * @param location - The location that is being tested for overlap.
   * @param testFn - Callback that determines whether the target passes hit testing. This callback
   *  can assume that `pruneFn` failed to prune the container.
   * @param pruneFn - Callback that determiness whether the target and all of its children
   *  cannot pass the hit test. It is used as a preliminary optimization to prune entire subtrees
   *  of the scene graph.
   * @returns An array holding the hit testing target and all its ancestors in order. The first element
   *  is the target itself and the last is {@link EventBoundary.rootTarget rootTarget}. This is the opposite
   *  order w.r.t. the propagation path. If no hit testing target is found, null is returned.
   */
  hitTestRecursive(currentTarget, eventMode, location, testFn, pruneFn) {
    if (this._interactivePrune(currentTarget) || pruneFn(currentTarget, location)) {
      return null;
    }
    if (currentTarget.eventMode === "dynamic" || eventMode === "dynamic") {
      EventsTicker.pauseUpdate = false;
    }
    if (currentTarget.interactiveChildren && currentTarget.children) {
      const children = currentTarget.children;
      const relativeLocation = location;
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        const nestedHit = this.hitTestRecursive(
          child,
          this._isInteractive(eventMode) ? eventMode : child.eventMode,
          relativeLocation,
          testFn,
          pruneFn
        );
        if (nestedHit) {
          if (nestedHit.length > 0 && !nestedHit[nestedHit.length - 1].parent) {
            continue;
          }
          const isInteractive = currentTarget.isInteractive();
          if (nestedHit.length > 0 || isInteractive)
            nestedHit.push(currentTarget);
          return nestedHit;
        }
      }
    }
    const isInteractiveMode = this._isInteractive(eventMode);
    const isInteractiveTarget = currentTarget.isInteractive();
    if (isInteractiveMode && testFn(currentTarget, location)) {
      return isInteractiveTarget ? [currentTarget] : [];
    }
    return null;
  }
  _isInteractive(int) {
    return int === "static" || int === "dynamic";
  }
  _interactivePrune(container) {
    if (!container || !container.visible || !container.renderable || !container.includeInBuild || !container.measurable) {
      return true;
    }
    if (container.eventMode === "none") {
      return true;
    }
    if (container.eventMode === "passive" && !container.interactiveChildren) {
      return true;
    }
    return false;
  }
  /**
   * Checks whether the container or any of its children cannot pass the hit test at all.
   *
   * {@link EventBoundary}'s implementation uses the {@link Container.hitArea hitArea}
   * and {@link Container._maskEffect} for pruning.
   * @param container - The container to prune.
   * @param location - The location to test for overlap.
   */
  hitPruneFn(container, location) {
    if (container.hitArea) {
      container.worldTransform.applyInverse(location, tempLocalMapping);
      if (!container.hitArea.contains(tempLocalMapping.x, tempLocalMapping.y)) {
        return true;
      }
    }
    if (container.effects && container.effects.length) {
      for (let i = 0; i < container.effects.length; i++) {
        const effect = container.effects[i];
        if (effect.containsPoint) {
          const effectContainsPoint = effect.containsPoint(location, this.hitTestFn);
          if (!effectContainsPoint) {
            return true;
          }
        }
      }
    }
    return false;
  }
  /**
   * Checks whether the container passes hit testing for the given location.
   * @param container - The container to test.
   * @param location - The location to test for overlap.
   * @returns - Whether `container` passes hit testing for `location`.
   */
  hitTestFn(container, location) {
    if (container.hitArea) {
      return true;
    }
    if (container?.containsPoint) {
      container.worldTransform.applyInverse(location, tempLocalMapping);
      return container.containsPoint(tempLocalMapping);
    }
    return false;
  }
  /**
   * Notify all the listeners to the event's `currentTarget`.
   *
   * If the `currentTarget` contains the property `on<type>`, then it is called here,
   * simulating the behavior from version 6.x and prior.
   * @param e - The event passed to the target.
   * @param type - The type of event to notify. Defaults to `e.type`.
   */
  notifyTarget(e, type) {
    if (!e.currentTarget.isInteractive()) {
      return;
    }
    type = type ?? e.type;
    const handlerKey = `on${type}`;
    e.currentTarget[handlerKey]?.(e);
    const key = e.eventPhase === e.CAPTURING_PHASE || e.eventPhase === e.AT_TARGET ? `${type}capture` : type;
    this._notifyListeners(e, key);
    if (e.eventPhase === e.AT_TARGET) {
      this._notifyListeners(e, type);
    }
  }
  /**
   * Maps the upstream `pointerdown` events to a downstream `pointerdown` event.
   *
   * `touchstart`, `rightdown`, `mousedown` events are also dispatched for specific pointer types.
   * @param from - The upstream `pointerdown` event.
   */
  mapPointerDown(from) {
    if (!(from instanceof FederatedPointerEvent)) {
      warn("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const e = this.createPointerEvent(from);
    this.dispatchEvent(e, "pointerdown");
    if (e.pointerType === "touch") {
      this.dispatchEvent(e, "touchstart");
    } else if (e.pointerType === "mouse" || e.pointerType === "pen") {
      const isRightButton = e.button === 2;
      this.dispatchEvent(e, isRightButton ? "rightdown" : "mousedown");
    }
    const trackingData = this.trackingData(from.pointerId);
    trackingData.pressTargetsByButton[from.button] = e.composedPath();
    this.freeEvent(e);
  }
  /**
   * Maps the upstream `pointermove` to downstream `pointerout`, `pointerover`, and `pointermove` events, in that order.
   *
   * The tracking data for the specific pointer has an updated `overTarget`. `mouseout`, `mouseover`,
   * `mousemove`, and `touchmove` events are fired as well for specific pointer types.
   * @param from - The upstream `pointermove` event.
   */
  mapPointerMove(from) {
    if (!(from instanceof FederatedPointerEvent)) {
      warn("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    this._allInteractiveElements.length = 0;
    this._hitElements.length = 0;
    this._isPointerMoveEvent = true;
    const e = this.createPointerEvent(from);
    this._isPointerMoveEvent = false;
    const isMouse = e.pointerType === "mouse" || e.pointerType === "pen";
    const trackingData = this.trackingData(from.pointerId);
    const outTarget = this.findMountedTarget(trackingData.overTargets);
    if (trackingData.overTargets?.length > 0 && outTarget !== e.target) {
      const outType = from.type === "mousemove" ? "mouseout" : "pointerout";
      const outEvent = this.createPointerEvent(from, outType, outTarget);
      this.dispatchEvent(outEvent, "pointerout");
      if (isMouse)
        this.dispatchEvent(outEvent, "mouseout");
      if (!e.composedPath().includes(outTarget)) {
        const leaveEvent = this.createPointerEvent(from, "pointerleave", outTarget);
        leaveEvent.eventPhase = leaveEvent.AT_TARGET;
        while (leaveEvent.target && !e.composedPath().includes(leaveEvent.target)) {
          leaveEvent.currentTarget = leaveEvent.target;
          this.notifyTarget(leaveEvent);
          if (isMouse)
            this.notifyTarget(leaveEvent, "mouseleave");
          leaveEvent.target = leaveEvent.target.parent;
        }
        this.freeEvent(leaveEvent);
      }
      this.freeEvent(outEvent);
    }
    if (outTarget !== e.target) {
      const overType = from.type === "mousemove" ? "mouseover" : "pointerover";
      const overEvent = this.clonePointerEvent(e, overType);
      this.dispatchEvent(overEvent, "pointerover");
      if (isMouse)
        this.dispatchEvent(overEvent, "mouseover");
      let overTargetAncestor = outTarget?.parent;
      while (overTargetAncestor && overTargetAncestor !== this.rootTarget.parent) {
        if (overTargetAncestor === e.target)
          break;
        overTargetAncestor = overTargetAncestor.parent;
      }
      const didPointerEnter = !overTargetAncestor || overTargetAncestor === this.rootTarget.parent;
      if (didPointerEnter) {
        const enterEvent = this.clonePointerEvent(e, "pointerenter");
        enterEvent.eventPhase = enterEvent.AT_TARGET;
        while (enterEvent.target && enterEvent.target !== outTarget && enterEvent.target !== this.rootTarget.parent) {
          enterEvent.currentTarget = enterEvent.target;
          this.notifyTarget(enterEvent);
          if (isMouse)
            this.notifyTarget(enterEvent, "mouseenter");
          enterEvent.target = enterEvent.target.parent;
        }
        this.freeEvent(enterEvent);
      }
      this.freeEvent(overEvent);
    }
    const allMethods = [];
    const allowGlobalPointerEvents = this.enableGlobalMoveEvents ?? true;
    this.moveOnAll ? allMethods.push("pointermove") : this.dispatchEvent(e, "pointermove");
    allowGlobalPointerEvents && allMethods.push("globalpointermove");
    if (e.pointerType === "touch") {
      this.moveOnAll ? allMethods.splice(1, 0, "touchmove") : this.dispatchEvent(e, "touchmove");
      allowGlobalPointerEvents && allMethods.push("globaltouchmove");
    }
    if (isMouse) {
      this.moveOnAll ? allMethods.splice(1, 0, "mousemove") : this.dispatchEvent(e, "mousemove");
      allowGlobalPointerEvents && allMethods.push("globalmousemove");
      this.cursor = e.target?.cursor;
    }
    if (allMethods.length > 0) {
      this.all(e, allMethods);
    }
    this._allInteractiveElements.length = 0;
    this._hitElements.length = 0;
    trackingData.overTargets = e.composedPath();
    this.freeEvent(e);
  }
  /**
   * Maps the upstream `pointerover` to downstream `pointerover` and `pointerenter` events, in that order.
   *
   * The tracking data for the specific pointer gets a new `overTarget`.
   * @param from - The upstream `pointerover` event.
   */
  mapPointerOver(from) {
    if (!(from instanceof FederatedPointerEvent)) {
      warn("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const trackingData = this.trackingData(from.pointerId);
    const e = this.createPointerEvent(from);
    const isMouse = e.pointerType === "mouse" || e.pointerType === "pen";
    this.dispatchEvent(e, "pointerover");
    if (isMouse)
      this.dispatchEvent(e, "mouseover");
    if (e.pointerType === "mouse")
      this.cursor = e.target?.cursor;
    const enterEvent = this.clonePointerEvent(e, "pointerenter");
    enterEvent.eventPhase = enterEvent.AT_TARGET;
    while (enterEvent.target && enterEvent.target !== this.rootTarget.parent) {
      enterEvent.currentTarget = enterEvent.target;
      this.notifyTarget(enterEvent);
      if (isMouse)
        this.notifyTarget(enterEvent, "mouseenter");
      enterEvent.target = enterEvent.target.parent;
    }
    trackingData.overTargets = e.composedPath();
    this.freeEvent(e);
    this.freeEvent(enterEvent);
  }
  /**
   * Maps the upstream `pointerout` to downstream `pointerout`, `pointerleave` events, in that order.
   *
   * The tracking data for the specific pointer is cleared of a `overTarget`.
   * @param from - The upstream `pointerout` event.
   */
  mapPointerOut(from) {
    if (!(from instanceof FederatedPointerEvent)) {
      warn("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const trackingData = this.trackingData(from.pointerId);
    if (trackingData.overTargets) {
      const isMouse = from.pointerType === "mouse" || from.pointerType === "pen";
      const outTarget = this.findMountedTarget(trackingData.overTargets);
      const outEvent = this.createPointerEvent(from, "pointerout", outTarget);
      this.dispatchEvent(outEvent);
      if (isMouse)
        this.dispatchEvent(outEvent, "mouseout");
      const leaveEvent = this.createPointerEvent(from, "pointerleave", outTarget);
      leaveEvent.eventPhase = leaveEvent.AT_TARGET;
      while (leaveEvent.target && leaveEvent.target !== this.rootTarget.parent) {
        leaveEvent.currentTarget = leaveEvent.target;
        this.notifyTarget(leaveEvent);
        if (isMouse)
          this.notifyTarget(leaveEvent, "mouseleave");
        leaveEvent.target = leaveEvent.target.parent;
      }
      trackingData.overTargets = null;
      this.freeEvent(outEvent);
      this.freeEvent(leaveEvent);
    }
    this.cursor = null;
  }
  /**
   * Maps the upstream `pointerup` event to downstream `pointerup`, `pointerupoutside`,
   * and `click`/`rightclick`/`pointertap` events, in that order.
   *
   * The `pointerupoutside` event bubbles from the original `pointerdown` target to the most specific
   * ancestor of the `pointerdown` and `pointerup` targets, which is also the `click` event's target. `touchend`,
   * `rightup`, `mouseup`, `touchendoutside`, `rightupoutside`, `mouseupoutside`, and `tap` are fired as well for
   * specific pointer types.
   * @param from - The upstream `pointerup` event.
   */
  mapPointerUp(from) {
    if (!(from instanceof FederatedPointerEvent)) {
      warn("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const now = performance.now();
    const e = this.createPointerEvent(from);
    this.dispatchEvent(e, "pointerup");
    if (e.pointerType === "touch") {
      this.dispatchEvent(e, "touchend");
    } else if (e.pointerType === "mouse" || e.pointerType === "pen") {
      const isRightButton = e.button === 2;
      this.dispatchEvent(e, isRightButton ? "rightup" : "mouseup");
    }
    const trackingData = this.trackingData(from.pointerId);
    const pressTarget = this.findMountedTarget(trackingData.pressTargetsByButton[from.button]);
    let clickTarget = pressTarget;
    if (pressTarget && !e.composedPath().includes(pressTarget)) {
      let currentTarget = pressTarget;
      while (currentTarget && !e.composedPath().includes(currentTarget)) {
        e.currentTarget = currentTarget;
        this.notifyTarget(e, "pointerupoutside");
        if (e.pointerType === "touch") {
          this.notifyTarget(e, "touchendoutside");
        } else if (e.pointerType === "mouse" || e.pointerType === "pen") {
          const isRightButton = e.button === 2;
          this.notifyTarget(e, isRightButton ? "rightupoutside" : "mouseupoutside");
        }
        currentTarget = currentTarget.parent;
      }
      delete trackingData.pressTargetsByButton[from.button];
      clickTarget = currentTarget;
    }
    if (clickTarget) {
      const clickEvent = this.clonePointerEvent(e, "click");
      clickEvent.target = clickTarget;
      clickEvent.path = null;
      if (!trackingData.clicksByButton[from.button]) {
        trackingData.clicksByButton[from.button] = {
          clickCount: 0,
          target: clickEvent.target,
          timeStamp: now
        };
      }
      const clickHistory = trackingData.clicksByButton[from.button];
      if (clickHistory.target === clickEvent.target && now - clickHistory.timeStamp < 200) {
        ++clickHistory.clickCount;
      } else {
        clickHistory.clickCount = 1;
      }
      clickHistory.target = clickEvent.target;
      clickHistory.timeStamp = now;
      clickEvent.detail = clickHistory.clickCount;
      if (clickEvent.pointerType === "mouse") {
        const isRightButton = clickEvent.button === 2;
        this.dispatchEvent(clickEvent, isRightButton ? "rightclick" : "click");
      } else if (clickEvent.pointerType === "touch") {
        this.dispatchEvent(clickEvent, "tap");
      }
      this.dispatchEvent(clickEvent, "pointertap");
      this.freeEvent(clickEvent);
    }
    this.freeEvent(e);
  }
  /**
   * Maps the upstream `pointerupoutside` event to a downstream `pointerupoutside` event, bubbling from the original
   * `pointerdown` target to `rootTarget`.
   *
   * (The most specific ancestor of the `pointerdown` event and the `pointerup` event must the
   * `{@link EventBoundary}'s root because the `pointerup` event occurred outside of the boundary.)
   *
   * `touchendoutside`, `mouseupoutside`, and `rightupoutside` events are fired as well for specific pointer
   * types. The tracking data for the specific pointer is cleared of a `pressTarget`.
   * @param from - The upstream `pointerupoutside` event.
   */
  mapPointerUpOutside(from) {
    if (!(from instanceof FederatedPointerEvent)) {
      warn("EventBoundary cannot map a non-pointer event as a pointer event");
      return;
    }
    const trackingData = this.trackingData(from.pointerId);
    const pressTarget = this.findMountedTarget(trackingData.pressTargetsByButton[from.button]);
    const e = this.createPointerEvent(from);
    if (pressTarget) {
      let currentTarget = pressTarget;
      while (currentTarget) {
        e.currentTarget = currentTarget;
        this.notifyTarget(e, "pointerupoutside");
        if (e.pointerType === "touch") {
          this.notifyTarget(e, "touchendoutside");
        } else if (e.pointerType === "mouse" || e.pointerType === "pen") {
          this.notifyTarget(e, e.button === 2 ? "rightupoutside" : "mouseupoutside");
        }
        currentTarget = currentTarget.parent;
      }
      delete trackingData.pressTargetsByButton[from.button];
    }
    this.freeEvent(e);
  }
  /**
   * Maps the upstream `wheel` event to a downstream `wheel` event.
   * @param from - The upstream `wheel` event.
   */
  mapWheel(from) {
    if (!(from instanceof FederatedWheelEvent)) {
      warn("EventBoundary cannot map a non-wheel event as a wheel event");
      return;
    }
    const wheelEvent = this.createWheelEvent(from);
    this.dispatchEvent(wheelEvent);
    this.freeEvent(wheelEvent);
  }
  /**
   * Finds the most specific event-target in the given propagation path that is still mounted in the scene graph.
   *
   * This is used to find the correct `pointerup` and `pointerout` target in the case that the original `pointerdown`
   * or `pointerover` target was unmounted from the scene graph.
   * @param propagationPath - The propagation path was valid in the past.
   * @returns - The most specific event-target still mounted at the same location in the scene graph.
   */
  findMountedTarget(propagationPath) {
    if (!propagationPath) {
      return null;
    }
    let currentTarget = propagationPath[0];
    for (let i = 1; i < propagationPath.length; i++) {
      if (propagationPath[i].parent === currentTarget) {
        currentTarget = propagationPath[i];
      } else {
        break;
      }
    }
    return currentTarget;
  }
  /**
   * Creates an event whose {@code originalEvent} is {@code from}, with an optional `type` and `target` override.
   *
   * The event is allocated using {@link EventBoundary#allocateEvent this.allocateEvent}.
   * @param from - The {@code originalEvent} for the returned event.
   * @param [type=from.type] - The type of the returned event.
   * @param target - The target of the returned event.
   */
  createPointerEvent(from, type, target) {
    const event = this.allocateEvent(FederatedPointerEvent);
    this.copyPointerData(from, event);
    this.copyMouseData(from, event);
    this.copyData(from, event);
    event.nativeEvent = from.nativeEvent;
    event.originalEvent = from;
    event.target = target ?? this.hitTest(event.global.x, event.global.y) ?? this._hitElements[0];
    if (typeof type === "string") {
      event.type = type;
    }
    return event;
  }
  /**
   * Creates a wheel event whose {@code originalEvent} is {@code from}.
   *
   * The event is allocated using {@link EventBoundary#allocateEvent this.allocateEvent}.
   * @param from - The upstream wheel event.
   */
  createWheelEvent(from) {
    const event = this.allocateEvent(FederatedWheelEvent);
    this.copyWheelData(from, event);
    this.copyMouseData(from, event);
    this.copyData(from, event);
    event.nativeEvent = from.nativeEvent;
    event.originalEvent = from;
    event.target = this.hitTest(event.global.x, event.global.y);
    return event;
  }
  /**
   * Clones the event {@code from}, with an optional {@code type} override.
   *
   * The event is allocated using {@link EventBoundary#allocateEvent this.allocateEvent}.
   * @param from - The event to clone.
   * @param [type=from.type] - The type of the returned event.
   */
  clonePointerEvent(from, type) {
    const event = this.allocateEvent(FederatedPointerEvent);
    event.nativeEvent = from.nativeEvent;
    event.originalEvent = from.originalEvent;
    this.copyPointerData(from, event);
    this.copyMouseData(from, event);
    this.copyData(from, event);
    event.target = from.target;
    event.path = from.composedPath().slice();
    event.type = type ?? event.type;
    return event;
  }
  /**
   * Copies wheel {@link FederatedWheelEvent} data from {@code from} into {@code to}.
   *
   * The following properties are copied:
   * + deltaMode
   * + deltaX
   * + deltaY
   * + deltaZ
   * @param from - The event to copy data from.
   * @param to - The event to copy data into.
   */
  copyWheelData(from, to) {
    to.deltaMode = from.deltaMode;
    to.deltaX = from.deltaX;
    to.deltaY = from.deltaY;
    to.deltaZ = from.deltaZ;
  }
  /**
   * Copies pointer {@link FederatedPointerEvent} data from {@code from} into {@code to}.
   *
   * The following properties are copied:
   * + pointerId
   * + width
   * + height
   * + isPrimary
   * + pointerType
   * + pressure
   * + tangentialPressure
   * + tiltX
   * + tiltY
   * @param from - The event to copy data from.
   * @param to - The event to copy data into.
   */
  copyPointerData(from, to) {
    if (!(from instanceof FederatedPointerEvent && to instanceof FederatedPointerEvent))
      return;
    to.pointerId = from.pointerId;
    to.width = from.width;
    to.height = from.height;
    to.isPrimary = from.isPrimary;
    to.pointerType = from.pointerType;
    to.pressure = from.pressure;
    to.tangentialPressure = from.tangentialPressure;
    to.tiltX = from.tiltX;
    to.tiltY = from.tiltY;
    to.twist = from.twist;
  }
  /**
   * Copies mouse {@link FederatedMouseEvent} data from {@code from} to {@code to}.
   *
   * The following properties are copied:
   * + altKey
   * + button
   * + buttons
   * + clientX
   * + clientY
   * + metaKey
   * + movementX
   * + movementY
   * + pageX
   * + pageY
   * + x
   * + y
   * + screen
   * + shiftKey
   * + global
   * @param from - The event to copy data from.
   * @param to - The event to copy data into.
   */
  copyMouseData(from, to) {
    if (!(from instanceof FederatedMouseEvent && to instanceof FederatedMouseEvent))
      return;
    to.altKey = from.altKey;
    to.button = from.button;
    to.buttons = from.buttons;
    to.client.copyFrom(from.client);
    to.ctrlKey = from.ctrlKey;
    to.metaKey = from.metaKey;
    to.movement.copyFrom(from.movement);
    to.screen.copyFrom(from.screen);
    to.shiftKey = from.shiftKey;
    to.global.copyFrom(from.global);
  }
  /**
   * Copies base {@link FederatedEvent} data from {@code from} into {@code to}.
   *
   * The following properties are copied:
   * + isTrusted
   * + srcElement
   * + timeStamp
   * + type
   * @param from - The event to copy data from.
   * @param to - The event to copy data into.
   */
  copyData(from, to) {
    to.isTrusted = from.isTrusted;
    to.srcElement = from.srcElement;
    to.timeStamp = performance.now();
    to.type = from.type;
    to.detail = from.detail;
    to.view = from.view;
    to.which = from.which;
    to.layer.copyFrom(from.layer);
    to.page.copyFrom(from.page);
  }
  /**
   * @param id - The pointer ID.
   * @returns The tracking data stored for the given pointer. If no data exists, a blank
   *  state will be created.
   */
  trackingData(id) {
    if (!this.mappingState.trackingData[id]) {
      this.mappingState.trackingData[id] = {
        pressTargetsByButton: {},
        clicksByButton: {},
        overTarget: null
      };
    }
    return this.mappingState.trackingData[id];
  }
  /**
   * Allocate a specific type of event from {@link EventBoundary#eventPool this.eventPool}.
   *
   * This allocation is constructor-agnostic, as long as it only takes one argument - this event
   * boundary.
   * @param constructor - The event's constructor.
   */
  allocateEvent(constructor) {
    if (!this.eventPool.has(constructor)) {
      this.eventPool.set(constructor, []);
    }
    const event = this.eventPool.get(constructor).pop() || new constructor(this);
    event.eventPhase = event.NONE;
    event.currentTarget = null;
    event.path = null;
    event.target = null;
    return event;
  }
  /**
   * Frees the event and puts it back into the event pool.
   *
   * It is illegal to reuse the event until it is allocated again, using `this.allocateEvent`.
   *
   * It is also advised that events not allocated from {@link EventBoundary#allocateEvent this.allocateEvent}
   * not be freed. This is because of the possibility that the same event is freed twice, which can cause
   * it to be allocated twice & result in overwriting.
   * @param event - The event to be freed.
   * @throws Error if the event is managed by another event boundary.
   */
  freeEvent(event) {
    if (event.manager !== this)
      throw new Error("It is illegal to free an event not managed by this EventBoundary!");
    const constructor = event.constructor;
    if (!this.eventPool.has(constructor)) {
      this.eventPool.set(constructor, []);
    }
    this.eventPool.get(constructor).push(event);
  }
  /**
   * Similar to {@link EventEmitter.emit}, except it stops if the `propagationImmediatelyStopped` flag
   * is set on the event.
   * @param e - The event to call each listener with.
   * @param type - The event key.
   */
  _notifyListeners(e, type) {
    const listeners = e.currentTarget._events[type];
    if (!listeners)
      return;
    if ("fn" in listeners) {
      if (listeners.once)
        e.currentTarget.removeListener(type, listeners.fn, void 0, true);
      listeners.fn.call(listeners.context, e);
    } else {
      for (let i = 0, j = listeners.length; i < j && !e.propagationImmediatelyStopped; i++) {
        if (listeners[i].once)
          e.currentTarget.removeListener(type, listeners[i].fn, void 0, true);
        listeners[i].fn.call(listeners[i].context, e);
      }
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/events/EventSystem.mjs
var MOUSE_POINTER_ID = 1;
var TOUCH_TO_POINTER = {
  touchstart: "pointerdown",
  touchend: "pointerup",
  touchendoutside: "pointerupoutside",
  touchmove: "pointermove",
  touchcancel: "pointercancel"
};
var _EventSystem = class _EventSystem2 {
  static {
    __name(this, "_EventSystem");
  }
  /**
   * @param {Renderer} renderer
   */
  constructor(renderer) {
    this.supportsTouchEvents = "ontouchstart" in globalThis;
    this.supportsPointerEvents = !!globalThis.PointerEvent;
    this.domElement = null;
    this.resolution = 1;
    this.renderer = renderer;
    this.rootBoundary = new EventBoundary(null);
    EventsTicker.init(this);
    this.autoPreventDefault = true;
    this._eventsAdded = false;
    this._rootPointerEvent = new FederatedPointerEvent(null);
    this._rootWheelEvent = new FederatedWheelEvent(null);
    this.cursorStyles = {
      default: "inherit",
      pointer: "pointer"
    };
    this.features = new Proxy({ ..._EventSystem2.defaultEventFeatures }, {
      set: (target, key, value) => {
        if (key === "globalMove") {
          this.rootBoundary.enableGlobalMoveEvents = value;
        }
        target[key] = value;
        return true;
      }
    });
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onPointerOverOut = this._onPointerOverOut.bind(this);
    this.onWheel = this.onWheel.bind(this);
  }
  /**
   * The default interaction mode for all display objects.
   * @see Container.eventMode
   * @type {EventMode}
   * @readonly
   * @since 7.2.0
   */
  static get defaultEventMode() {
    return this._defaultEventMode;
  }
  /**
   * Runner init called, view is available at this point.
   * @ignore
   */
  init(options) {
    const { canvas, resolution } = this.renderer;
    this.setTargetElement(canvas);
    this.resolution = resolution;
    _EventSystem2._defaultEventMode = options.eventMode ?? "passive";
    Object.assign(this.features, options.eventFeatures ?? {});
    this.rootBoundary.enableGlobalMoveEvents = this.features.globalMove;
  }
  /**
   * Handle changing resolution.
   * @ignore
   */
  resolutionChange(resolution) {
    this.resolution = resolution;
  }
  /** Destroys all event listeners and detaches the renderer. */
  destroy() {
    this.setTargetElement(null);
    this.renderer = null;
    this._currentCursor = null;
  }
  /**
   * Sets the current cursor mode, handling any callbacks or CSS style changes.
   * @param mode - cursor mode, a key from the cursorStyles dictionary
   */
  setCursor(mode) {
    mode = mode || "default";
    let applyStyles = true;
    if (globalThis.OffscreenCanvas && this.domElement instanceof OffscreenCanvas) {
      applyStyles = false;
    }
    if (this._currentCursor === mode) {
      return;
    }
    this._currentCursor = mode;
    const style = this.cursorStyles[mode];
    if (style) {
      switch (typeof style) {
        case "string":
          if (applyStyles) {
            this.domElement.style.cursor = style;
          }
          break;
        case "function":
          style(mode);
          break;
        case "object":
          if (applyStyles) {
            Object.assign(this.domElement.style, style);
          }
          break;
      }
    } else if (applyStyles && typeof mode === "string" && !Object.prototype.hasOwnProperty.call(this.cursorStyles, mode)) {
      this.domElement.style.cursor = mode;
    }
  }
  /**
   * The global pointer event.
   * Useful for getting the pointer position without listening to events.
   * @since 7.2.0
   */
  get pointer() {
    return this._rootPointerEvent;
  }
  /**
   * Event handler for pointer down events on {@link EventSystem#domElement this.domElement}.
   * @param nativeEvent - The native mouse/pointer/touch event.
   */
  _onPointerDown(nativeEvent) {
    if (!this.features.click)
      return;
    this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;
    const events = this._normalizeToPointerData(nativeEvent);
    if (this.autoPreventDefault && events[0].isNormalized) {
      const cancelable = nativeEvent.cancelable || !("cancelable" in nativeEvent);
      if (cancelable) {
        nativeEvent.preventDefault();
      }
    }
    for (let i = 0, j = events.length; i < j; i++) {
      const nativeEvent2 = events[i];
      const federatedEvent = this._bootstrapEvent(this._rootPointerEvent, nativeEvent2);
      this.rootBoundary.mapEvent(federatedEvent);
    }
    this.setCursor(this.rootBoundary.cursor);
  }
  /**
   * Event handler for pointer move events on on {@link EventSystem#domElement this.domElement}.
   * @param nativeEvent - The native mouse/pointer/touch events.
   */
  _onPointerMove(nativeEvent) {
    if (!this.features.move)
      return;
    this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;
    EventsTicker.pointerMoved();
    const normalizedEvents = this._normalizeToPointerData(nativeEvent);
    for (let i = 0, j = normalizedEvents.length; i < j; i++) {
      const event = this._bootstrapEvent(this._rootPointerEvent, normalizedEvents[i]);
      this.rootBoundary.mapEvent(event);
    }
    this.setCursor(this.rootBoundary.cursor);
  }
  /**
   * Event handler for pointer up events on {@link EventSystem#domElement this.domElement}.
   * @param nativeEvent - The native mouse/pointer/touch event.
   */
  _onPointerUp(nativeEvent) {
    if (!this.features.click)
      return;
    this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;
    let target = nativeEvent.target;
    if (nativeEvent.composedPath && nativeEvent.composedPath().length > 0) {
      target = nativeEvent.composedPath()[0];
    }
    const outside = target !== this.domElement ? "outside" : "";
    const normalizedEvents = this._normalizeToPointerData(nativeEvent);
    for (let i = 0, j = normalizedEvents.length; i < j; i++) {
      const event = this._bootstrapEvent(this._rootPointerEvent, normalizedEvents[i]);
      event.type += outside;
      this.rootBoundary.mapEvent(event);
    }
    this.setCursor(this.rootBoundary.cursor);
  }
  /**
   * Event handler for pointer over & out events on {@link EventSystem#domElement this.domElement}.
   * @param nativeEvent - The native mouse/pointer/touch event.
   */
  _onPointerOverOut(nativeEvent) {
    if (!this.features.click)
      return;
    this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;
    const normalizedEvents = this._normalizeToPointerData(nativeEvent);
    for (let i = 0, j = normalizedEvents.length; i < j; i++) {
      const event = this._bootstrapEvent(this._rootPointerEvent, normalizedEvents[i]);
      this.rootBoundary.mapEvent(event);
    }
    this.setCursor(this.rootBoundary.cursor);
  }
  /**
   * Passive handler for `wheel` events on {@link EventSystem.domElement this.domElement}.
   * @param nativeEvent - The native wheel event.
   */
  onWheel(nativeEvent) {
    if (!this.features.wheel)
      return;
    const wheelEvent = this.normalizeWheelEvent(nativeEvent);
    this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;
    this.rootBoundary.mapEvent(wheelEvent);
  }
  /**
   * Sets the {@link EventSystem#domElement domElement} and binds event listeners.
   *
   * To deregister the current DOM element without setting a new one, pass {@code null}.
   * @param element - The new DOM element.
   */
  setTargetElement(element) {
    this._removeEvents();
    this.domElement = element;
    EventsTicker.domElement = element;
    this._addEvents();
  }
  /** Register event listeners on {@link Renderer#domElement this.domElement}. */
  _addEvents() {
    if (this._eventsAdded || !this.domElement) {
      return;
    }
    EventsTicker.addTickerListener();
    const style = this.domElement.style;
    if (style) {
      if (globalThis.navigator.msPointerEnabled) {
        style.msContentZooming = "none";
        style.msTouchAction = "none";
      } else if (this.supportsPointerEvents) {
        style.touchAction = "none";
      }
    }
    if (this.supportsPointerEvents) {
      globalThis.document.addEventListener("pointermove", this._onPointerMove, true);
      this.domElement.addEventListener("pointerdown", this._onPointerDown, true);
      this.domElement.addEventListener("pointerleave", this._onPointerOverOut, true);
      this.domElement.addEventListener("pointerover", this._onPointerOverOut, true);
      globalThis.addEventListener("pointerup", this._onPointerUp, true);
    } else {
      globalThis.document.addEventListener("mousemove", this._onPointerMove, true);
      this.domElement.addEventListener("mousedown", this._onPointerDown, true);
      this.domElement.addEventListener("mouseout", this._onPointerOverOut, true);
      this.domElement.addEventListener("mouseover", this._onPointerOverOut, true);
      globalThis.addEventListener("mouseup", this._onPointerUp, true);
      if (this.supportsTouchEvents) {
        this.domElement.addEventListener("touchstart", this._onPointerDown, true);
        this.domElement.addEventListener("touchend", this._onPointerUp, true);
        this.domElement.addEventListener("touchmove", this._onPointerMove, true);
      }
    }
    this.domElement.addEventListener("wheel", this.onWheel, {
      passive: true,
      capture: true
    });
    this._eventsAdded = true;
  }
  /** Unregister event listeners on {@link EventSystem#domElement this.domElement}. */
  _removeEvents() {
    if (!this._eventsAdded || !this.domElement) {
      return;
    }
    EventsTicker.removeTickerListener();
    const style = this.domElement.style;
    if (style) {
      if (globalThis.navigator.msPointerEnabled) {
        style.msContentZooming = "";
        style.msTouchAction = "";
      } else if (this.supportsPointerEvents) {
        style.touchAction = "";
      }
    }
    if (this.supportsPointerEvents) {
      globalThis.document.removeEventListener("pointermove", this._onPointerMove, true);
      this.domElement.removeEventListener("pointerdown", this._onPointerDown, true);
      this.domElement.removeEventListener("pointerleave", this._onPointerOverOut, true);
      this.domElement.removeEventListener("pointerover", this._onPointerOverOut, true);
      globalThis.removeEventListener("pointerup", this._onPointerUp, true);
    } else {
      globalThis.document.removeEventListener("mousemove", this._onPointerMove, true);
      this.domElement.removeEventListener("mousedown", this._onPointerDown, true);
      this.domElement.removeEventListener("mouseout", this._onPointerOverOut, true);
      this.domElement.removeEventListener("mouseover", this._onPointerOverOut, true);
      globalThis.removeEventListener("mouseup", this._onPointerUp, true);
      if (this.supportsTouchEvents) {
        this.domElement.removeEventListener("touchstart", this._onPointerDown, true);
        this.domElement.removeEventListener("touchend", this._onPointerUp, true);
        this.domElement.removeEventListener("touchmove", this._onPointerMove, true);
      }
    }
    this.domElement.removeEventListener("wheel", this.onWheel, true);
    this.domElement = null;
    this._eventsAdded = false;
  }
  /**
   * Maps x and y coords from a DOM object and maps them correctly to the PixiJS view. The
   * resulting value is stored in the point. This takes into account the fact that the DOM
   * element could be scaled and positioned anywhere on the screen.
   * @param  {PointData} point - the point that the result will be stored in
   * @param  {number} x - the x coord of the position to map
   * @param  {number} y - the y coord of the position to map
   */
  mapPositionToPoint(point, x, y) {
    const rect = this.domElement.isConnected ? this.domElement.getBoundingClientRect() : {
      x: 0,
      y: 0,
      width: this.domElement.width,
      height: this.domElement.height,
      left: 0,
      top: 0
    };
    const resolutionMultiplier = 1 / this.resolution;
    point.x = (x - rect.left) * (this.domElement.width / rect.width) * resolutionMultiplier;
    point.y = (y - rect.top) * (this.domElement.height / rect.height) * resolutionMultiplier;
  }
  /**
   * Ensures that the original event object contains all data that a regular pointer event would have
   * @param event - The original event data from a touch or mouse event
   * @returns An array containing a single normalized pointer event, in the case of a pointer
   *  or mouse event, or a multiple normalized pointer events if there are multiple changed touches
   */
  _normalizeToPointerData(event) {
    const normalizedEvents = [];
    if (this.supportsTouchEvents && event instanceof TouchEvent) {
      for (let i = 0, li = event.changedTouches.length; i < li; i++) {
        const touch = event.changedTouches[i];
        if (typeof touch.button === "undefined")
          touch.button = 0;
        if (typeof touch.buttons === "undefined")
          touch.buttons = 1;
        if (typeof touch.isPrimary === "undefined") {
          touch.isPrimary = event.touches.length === 1 && event.type === "touchstart";
        }
        if (typeof touch.width === "undefined")
          touch.width = touch.radiusX || 1;
        if (typeof touch.height === "undefined")
          touch.height = touch.radiusY || 1;
        if (typeof touch.tiltX === "undefined")
          touch.tiltX = 0;
        if (typeof touch.tiltY === "undefined")
          touch.tiltY = 0;
        if (typeof touch.pointerType === "undefined")
          touch.pointerType = "touch";
        if (typeof touch.pointerId === "undefined")
          touch.pointerId = touch.identifier || 0;
        if (typeof touch.pressure === "undefined")
          touch.pressure = touch.force || 0.5;
        if (typeof touch.twist === "undefined")
          touch.twist = 0;
        if (typeof touch.tangentialPressure === "undefined")
          touch.tangentialPressure = 0;
        if (typeof touch.layerX === "undefined")
          touch.layerX = touch.offsetX = touch.clientX;
        if (typeof touch.layerY === "undefined")
          touch.layerY = touch.offsetY = touch.clientY;
        touch.isNormalized = true;
        touch.type = event.type;
        normalizedEvents.push(touch);
      }
    } else if (!globalThis.MouseEvent || event instanceof MouseEvent && (!this.supportsPointerEvents || !(event instanceof globalThis.PointerEvent))) {
      const tempEvent = event;
      if (typeof tempEvent.isPrimary === "undefined")
        tempEvent.isPrimary = true;
      if (typeof tempEvent.width === "undefined")
        tempEvent.width = 1;
      if (typeof tempEvent.height === "undefined")
        tempEvent.height = 1;
      if (typeof tempEvent.tiltX === "undefined")
        tempEvent.tiltX = 0;
      if (typeof tempEvent.tiltY === "undefined")
        tempEvent.tiltY = 0;
      if (typeof tempEvent.pointerType === "undefined")
        tempEvent.pointerType = "mouse";
      if (typeof tempEvent.pointerId === "undefined")
        tempEvent.pointerId = MOUSE_POINTER_ID;
      if (typeof tempEvent.pressure === "undefined")
        tempEvent.pressure = 0.5;
      if (typeof tempEvent.twist === "undefined")
        tempEvent.twist = 0;
      if (typeof tempEvent.tangentialPressure === "undefined")
        tempEvent.tangentialPressure = 0;
      tempEvent.isNormalized = true;
      normalizedEvents.push(tempEvent);
    } else {
      normalizedEvents.push(event);
    }
    return normalizedEvents;
  }
  /**
   * Normalizes the native {@link https://w3c.github.io/uievents/#interface-wheelevent WheelEvent}.
   *
   * The returned {@link FederatedWheelEvent} is a shared instance. It will not persist across
   * multiple native wheel events.
   * @param nativeEvent - The native wheel event that occurred on the canvas.
   * @returns A federated wheel event.
   */
  normalizeWheelEvent(nativeEvent) {
    const event = this._rootWheelEvent;
    this._transferMouseData(event, nativeEvent);
    event.deltaX = nativeEvent.deltaX;
    event.deltaY = nativeEvent.deltaY;
    event.deltaZ = nativeEvent.deltaZ;
    event.deltaMode = nativeEvent.deltaMode;
    this.mapPositionToPoint(event.screen, nativeEvent.clientX, nativeEvent.clientY);
    event.global.copyFrom(event.screen);
    event.offset.copyFrom(event.screen);
    event.nativeEvent = nativeEvent;
    event.type = nativeEvent.type;
    return event;
  }
  /**
   * Normalizes the `nativeEvent` into a federateed {@link FederatedPointerEvent}.
   * @param event
   * @param nativeEvent
   */
  _bootstrapEvent(event, nativeEvent) {
    event.originalEvent = null;
    event.nativeEvent = nativeEvent;
    event.pointerId = nativeEvent.pointerId;
    event.width = nativeEvent.width;
    event.height = nativeEvent.height;
    event.isPrimary = nativeEvent.isPrimary;
    event.pointerType = nativeEvent.pointerType;
    event.pressure = nativeEvent.pressure;
    event.tangentialPressure = nativeEvent.tangentialPressure;
    event.tiltX = nativeEvent.tiltX;
    event.tiltY = nativeEvent.tiltY;
    event.twist = nativeEvent.twist;
    this._transferMouseData(event, nativeEvent);
    this.mapPositionToPoint(event.screen, nativeEvent.clientX, nativeEvent.clientY);
    event.global.copyFrom(event.screen);
    event.offset.copyFrom(event.screen);
    event.isTrusted = nativeEvent.isTrusted;
    if (event.type === "pointerleave") {
      event.type = "pointerout";
    }
    if (event.type.startsWith("mouse")) {
      event.type = event.type.replace("mouse", "pointer");
    }
    if (event.type.startsWith("touch")) {
      event.type = TOUCH_TO_POINTER[event.type] || event.type;
    }
    return event;
  }
  /**
   * Transfers base & mouse event data from the {@code nativeEvent} to the federated event.
   * @param event
   * @param nativeEvent
   */
  _transferMouseData(event, nativeEvent) {
    event.isTrusted = nativeEvent.isTrusted;
    event.srcElement = nativeEvent.srcElement;
    event.timeStamp = performance.now();
    event.type = nativeEvent.type;
    event.altKey = nativeEvent.altKey;
    event.button = nativeEvent.button;
    event.buttons = nativeEvent.buttons;
    event.client.x = nativeEvent.clientX;
    event.client.y = nativeEvent.clientY;
    event.ctrlKey = nativeEvent.ctrlKey;
    event.metaKey = nativeEvent.metaKey;
    event.movement.x = nativeEvent.movementX;
    event.movement.y = nativeEvent.movementY;
    event.page.x = nativeEvent.pageX;
    event.page.y = nativeEvent.pageY;
    event.relatedTarget = null;
    event.shiftKey = nativeEvent.shiftKey;
  }
};
_EventSystem.extension = {
  name: "events",
  type: [
    ExtensionType.WebGLSystem,
    ExtensionType.CanvasSystem,
    ExtensionType.WebGPUSystem
  ],
  priority: -1
};
_EventSystem.defaultEventFeatures = {
  /** Enables pointer events associated with pointer movement. */
  move: true,
  /** Enables global pointer move events. */
  globalMove: true,
  /** Enables pointer events associated with clicking. */
  click: true,
  /** Enables wheel events. */
  wheel: true
};
var EventSystem = _EventSystem;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/events/FederatedEventTarget.mjs
var FederatedContainer = {
  /**
   * Property-based event handler for the `click` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onclick = (event) => {
   *  //some function here that happens on click
   * }
   */
  onclick: null,
  /**
   * Property-based event handler for the `mousedown` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmousedown = (event) => {
   *  //some function here that happens on mousedown
   * }
   */
  onmousedown: null,
  /**
   * Property-based event handler for the `mouseenter` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmouseenter = (event) => {
   *  //some function here that happens on mouseenter
   * }
   */
  onmouseenter: null,
  /**
   * Property-based event handler for the `mouseleave` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmouseleave = (event) => {
   *  //some function here that happens on mouseleave
   * }
   */
  onmouseleave: null,
  /**
   * Property-based event handler for the `mousemove` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmousemove = (event) => {
   *  //some function here that happens on mousemove
   * }
   */
  onmousemove: null,
  /**
   * Property-based event handler for the `globalmousemove` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onglobalmousemove = (event) => {
   *  //some function here that happens on globalmousemove
   * }
   */
  onglobalmousemove: null,
  /**
   * Property-based event handler for the `mouseout` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmouseout = (event) => {
   *  //some function here that happens on mouseout
   * }
   */
  onmouseout: null,
  /**
   * Property-based event handler for the `mouseover` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmouseover = (event) => {
   *  //some function here that happens on mouseover
   * }
   */
  onmouseover: null,
  /**
   * Property-based event handler for the `mouseup` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmouseup = (event) => {
   *  //some function here that happens on mouseup
   * }
   */
  onmouseup: null,
  /**
   * Property-based event handler for the `mouseupoutside` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onmouseupoutside = (event) => {
   *  //some function here that happens on mouseupoutside
   * }
   */
  onmouseupoutside: null,
  /**
   * Property-based event handler for the `pointercancel` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointercancel = (event) => {
   *  //some function here that happens on pointercancel
   * }
   */
  onpointercancel: null,
  /**
   * Property-based event handler for the `pointerdown` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerdown = (event) => {
   *  //some function here that happens on pointerdown
   * }
   */
  onpointerdown: null,
  /**
   * Property-based event handler for the `pointerenter` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerenter = (event) => {
   *  //some function here that happens on pointerenter
   * }
   */
  onpointerenter: null,
  /**
   * Property-based event handler for the `pointerleave` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerleave = (event) => {
   *  //some function here that happens on pointerleave
   * }
   */
  onpointerleave: null,
  /**
   * Property-based event handler for the `pointermove` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointermove = (event) => {
   *  //some function here that happens on pointermove
   * }
   */
  onpointermove: null,
  /**
   * Property-based event handler for the `globalpointermove` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onglobalpointermove = (event) => {
   *  //some function here that happens on globalpointermove
   * }
   */
  onglobalpointermove: null,
  /**
   * Property-based event handler for the `pointerout` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerout = (event) => {
   *  //some function here that happens on pointerout
   * }
   */
  onpointerout: null,
  /**
   * Property-based event handler for the `pointerover` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerover = (event) => {
   *  //some function here that happens on pointerover
   * }
   */
  onpointerover: null,
  /**
   * Property-based event handler for the `pointertap` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointertap = (event) => {
   *  //some function here that happens on pointertap
   * }
   */
  onpointertap: null,
  /**
   * Property-based event handler for the `pointerup` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerup = (event) => {
   *  //some function here that happens on pointerup
   * }
   */
  onpointerup: null,
  /**
   * Property-based event handler for the `pointerupoutside` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onpointerupoutside = (event) => {
   *  //some function here that happens on pointerupoutside
   * }
   */
  onpointerupoutside: null,
  /**
   * Property-based event handler for the `rightclick` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onrightclick = (event) => {
   *  //some function here that happens on rightclick
   * }
   */
  onrightclick: null,
  /**
   * Property-based event handler for the `rightdown` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onrightdown = (event) => {
   *  //some function here that happens on rightdown
   * }
   */
  onrightdown: null,
  /**
   * Property-based event handler for the `rightup` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onrightup = (event) => {
   *  //some function here that happens on rightup
   * }
   */
  onrightup: null,
  /**
   * Property-based event handler for the `rightupoutside` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onrightupoutside = (event) => {
   *  //some function here that happens on rightupoutside
   * }
   */
  onrightupoutside: null,
  /**
   * Property-based event handler for the `tap` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.ontap = (event) => {
   *  //some function here that happens on tap
   * }
   */
  ontap: null,
  /**
   * Property-based event handler for the `touchcancel` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.ontouchcancel = (event) => {
   *  //some function here that happens on touchcancel
   * }
   */
  ontouchcancel: null,
  /**
   * Property-based event handler for the `touchend` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.ontouchend = (event) => {
   *  //some function here that happens on touchend
   * }
   */
  ontouchend: null,
  /**
   * Property-based event handler for the `touchendoutside` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.ontouchendoutside = (event) => {
   *  //some function here that happens on touchendoutside
   * }
   */
  ontouchendoutside: null,
  /**
   * Property-based event handler for the `touchmove` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.ontouchmove = (event) => {
   *  //some function here that happens on touchmove
   * }
   */
  ontouchmove: null,
  /**
   * Property-based event handler for the `globaltouchmove` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onglobaltouchmove = (event) => {
   *  //some function here that happens on globaltouchmove
   * }
   */
  onglobaltouchmove: null,
  /**
   * Property-based event handler for the `touchstart` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.ontouchstart = (event) => {
   *  //some function here that happens on touchstart
   * }
   */
  ontouchstart: null,
  /**
   * Property-based event handler for the `wheel` event.
   * @memberof scene.Container#
   * @default null
   * @example
   * this.onwheel = (event) => {
   *  //some function here that happens on wheel
   * }
   */
  onwheel: null,
  /**
   * Enable interaction events for the Container. Touch, pointer and mouse
   * @memberof scene.Container#
   */
  get interactive() {
    return this.eventMode === "dynamic" || this.eventMode === "static";
  },
  set interactive(value) {
    this.eventMode = value ? "static" : "passive";
  },
  /**
   * @ignore
   */
  _internalEventMode: void 0,
  /**
   * Enable interaction events for the Container. Touch, pointer and mouse.
   * There are 5 types of interaction settings:
   * - `'none'`: Ignores all interaction events, even on its children.
   * - `'passive'`: **(default)** Does not emit events and ignores all hit testing on itself and non-interactive children.
   * Interactive children will still emit events.
   * - `'auto'`: Does not emit events but is hit tested if parent is interactive. Same as `interactive = false` in v7
   * - `'static'`: Emit events and is hit tested. Same as `interaction = true` in v7
   * - `'dynamic'`: Emits events and is hit tested but will also receive mock interaction events fired from a ticker to
   * allow for interaction when the mouse isn't moving
   * @example
   * import { Sprite } from 'pixi.js';
   *
   * const sprite = new Sprite(texture);
   * sprite.eventMode = 'static';
   * sprite.on('tap', (event) => {
   *     // Handle event
   * });
   * @memberof scene.Container#
   * @since 7.2.0
   */
  get eventMode() {
    return this._internalEventMode ?? EventSystem.defaultEventMode;
  },
  set eventMode(value) {
    this._internalEventMode = value;
  },
  /**
   * Determines if the container is interactive or not
   * @returns {boolean} Whether the container is interactive or not
   * @memberof scene.Container#
   * @since 7.2.0
   * @example
   * import { Sprite } from 'pixi.js';
   *
   * const sprite = new Sprite(texture);
   * sprite.eventMode = 'static';
   * sprite.isInteractive(); // true
   *
   * sprite.eventMode = 'dynamic';
   * sprite.isInteractive(); // true
   *
   * sprite.eventMode = 'none';
   * sprite.isInteractive(); // false
   *
   * sprite.eventMode = 'passive';
   * sprite.isInteractive(); // false
   *
   * sprite.eventMode = 'auto';
   * sprite.isInteractive(); // false
   */
  isInteractive() {
    return this.eventMode === "static" || this.eventMode === "dynamic";
  },
  /**
   * Determines if the children to the container can be clicked/touched
   * Setting this to false allows PixiJS to bypass a recursive `hitTest` function
   * @memberof scene.Container#
   */
  interactiveChildren: true,
  /**
   * Interaction shape. Children will be hit first, then this shape will be checked.
   * Setting this will cause this shape to be checked in hit tests rather than the container's bounds.
   * @example
   * import { Rectangle, Sprite } from 'pixi.js';
   *
   * const sprite = new Sprite(texture);
   * sprite.interactive = true;
   * sprite.hitArea = new Rectangle(0, 0, 100, 100);
   * @member {IHitArea}
   * @memberof scene.Container#
   */
  hitArea: null,
  /**
   * Unlike `on` or `addListener` which are methods from EventEmitter, `addEventListener`
   * seeks to be compatible with the DOM's `addEventListener` with support for options.
   * @memberof scene.Container
   * @param type - The type of event to listen to.
   * @param listener - The listener callback or object.
   * @param options - Listener options, used for capture phase.
   * @example
   * // Tell the user whether they did a single, double, triple, or nth click.
   * button.addEventListener('click', {
   *     handleEvent(e): {
   *         let prefix;
   *
   *         switch (e.detail) {
   *             case 1: prefix = 'single'; break;
   *             case 2: prefix = 'double'; break;
   *             case 3: prefix = 'triple'; break;
   *             default: prefix = e.detail + 'th'; break;
   *         }
   *
   *         console.log('That was a ' + prefix + 'click');
   *     }
   * });
   *
   * // But skip the first click!
   * button.parent.addEventListener('click', function blockClickOnce(e) {
   *     e.stopImmediatePropagation();
   *     button.parent.removeEventListener('click', blockClickOnce, true);
   * }, {
   *     capture: true,
   * });
   */
  addEventListener(type, listener, options) {
    const capture = typeof options === "boolean" && options || typeof options === "object" && options.capture;
    const signal = typeof options === "object" ? options.signal : void 0;
    const once = typeof options === "object" ? options.once === true : false;
    const context = typeof listener === "function" ? void 0 : listener;
    type = capture ? `${type}capture` : type;
    const listenerFn = typeof listener === "function" ? listener : listener.handleEvent;
    const emitter = this;
    if (signal) {
      signal.addEventListener("abort", () => {
        emitter.off(type, listenerFn, context);
      });
    }
    if (once) {
      emitter.once(type, listenerFn, context);
    } else {
      emitter.on(type, listenerFn, context);
    }
  },
  /**
   * Unlike `off` or `removeListener` which are methods from EventEmitter, `removeEventListener`
   * seeks to be compatible with the DOM's `removeEventListener` with support for options.
   * @memberof scene.Container
   * @param type - The type of event the listener is bound to.
   * @param listener - The listener callback or object.
   * @param options - The original listener options. This is required to deregister a capture phase listener.
   */
  removeEventListener(type, listener, options) {
    const capture = typeof options === "boolean" && options || typeof options === "object" && options.capture;
    const context = typeof listener === "function" ? void 0 : listener;
    type = capture ? `${type}capture` : type;
    listener = typeof listener === "function" ? listener : listener.handleEvent;
    this.off(type, listener, context);
  },
  /**
   * Dispatch the event on this {@link Container} using the event's {@link EventBoundary}.
   *
   * The target of the event is set to `this` and the `defaultPrevented` flag is cleared before dispatch.
   * @memberof scene.Container
   * @param e - The event to dispatch.
   * @returns Whether the {@link FederatedEvent.preventDefault preventDefault}() method was not invoked.
   * @example
   * // Reuse a click event!
   * button.dispatchEvent(clickEvent);
   */
  dispatchEvent(e) {
    if (!(e instanceof FederatedEvent)) {
      throw new Error("Container cannot propagate events outside of the Federated Events API");
    }
    e.defaultPrevented = false;
    e.path = null;
    e.target = this;
    e.manager.dispatchEvent(e);
    return !e.defaultPrevented;
  }
};

export {
  FederatedEvent,
  isMobile2 as isMobile,
  AccessibilitySystem,
  accessibilityTarget,
  EventsTicker,
  FederatedMouseEvent,
  FederatedPointerEvent,
  FederatedWheelEvent,
  EventBoundary,
  EventSystem,
  FederatedContainer
};
//# sourceMappingURL=chunk-CHQOCQOG.js.map
