var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// runtime/worlds/dreamlab/survival/spin-example.ts
import { Behavior } from "@dreamlab/engine";

// runtime/worlds/dreamlab/survival/deptest.ts
function hi(test) {
  console.log("hello " + test);
}
__name(hi, "hi");

// runtime/worlds/dreamlab/survival/spin-example.ts
var SpinBehavior = class _SpinBehavior extends Behavior {
  static {
    __name(this, "SpinBehavior");
  }
  speed = 1;
  onInitialize() {
    this.value(_SpinBehavior, "speed");
  }
  onTick() {
    this.entity.transform.rotation += this.speed * (Math.PI / this.game.time.TPS);
    hi("there!");
  }
};
export {
  SpinBehavior as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3Bpbi1leGFtcGxlLnRzIiwgImRlcHRlc3QudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEJlaGF2aW9yIH0gZnJvbSBcIkBkcmVhbWxhYi9lbmdpbmVcIjtcbmltcG9ydCB7IGhpIH0gZnJvbSBcIi4vZGVwdGVzdC50c1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTcGluQmVoYXZpb3IgZXh0ZW5kcyBCZWhhdmlvciB7XG4gIHNwZWVkOiBudW1iZXIgPSAxLjA7XG5cbiAgb25Jbml0aWFsaXplKCkge1xuICAgIHRoaXMudmFsdWUoU3BpbkJlaGF2aW9yLCBcInNwZWVkXCIpO1xuICB9XG5cbiAgb25UaWNrKCkge1xuICAgIHRoaXMuZW50aXR5LnRyYW5zZm9ybS5yb3RhdGlvbiArPSB0aGlzLnNwZWVkICogKE1hdGguUEkgLyB0aGlzLmdhbWUudGltZS5UUFMpO1xuICAgIGhpKCd0aGVyZSEnKVxuICB9XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGhpKHRlc3Q6IHN0cmluZykge1xuICAgIGNvbnNvbGUubG9nKCdoZWxsbyAnICsgdGVzdClcbn0iXSwKICAibWFwcGluZ3MiOiAiOzs7O0FBQUEsU0FBUyxnQkFBZ0I7OztBQ0FsQixTQUFTLEdBQUcsTUFBYztBQUM3QixVQUFRLElBQUksV0FBVyxJQUFJO0FBQy9CO0FBRmdCOzs7QURHaEIsSUFBcUIsZUFBckIsTUFBcUIsc0JBQXFCLFNBQVM7QUFBQSxFQUhuRCxPQUdtRDtBQUFBO0FBQUE7QUFBQSxFQUNqRCxRQUFnQjtBQUFBLEVBRWhCLGVBQWU7QUFDYixTQUFLLE1BQU0sZUFBYyxPQUFPO0FBQUEsRUFDbEM7QUFBQSxFQUVBLFNBQVM7QUFDUCxTQUFLLE9BQU8sVUFBVSxZQUFZLEtBQUssU0FBUyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUs7QUFDekUsT0FBRyxRQUFRO0FBQUEsRUFDYjtBQUNGOyIsCiAgIm5hbWVzIjogW10KfQo=
