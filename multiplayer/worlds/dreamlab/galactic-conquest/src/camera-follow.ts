import { Behavior, Camera } from "@dreamlab/engine";

export default class CameraFollow extends Behavior {
  onPostTick(): void {
    const target = this.entity._.PlayerSprite;
    const camera = Camera.getActive(this.game);
    if (camera) camera.pos.assign(target.globalTransform.position);
  }
}
