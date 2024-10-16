import { Behavior, Camera } from "@dreamlab/engine";

export default class CameraFollow extends Behavior {
  onPostTick(): void {
    if (!this.game.isClient()) return;
    if (this.entity.authority !== this.game.network.self) return;

    const target = this.entity;
    const camera = Camera.getActive(this.game);
    if (camera) camera.pos.assign(target.pos);
  }
}
