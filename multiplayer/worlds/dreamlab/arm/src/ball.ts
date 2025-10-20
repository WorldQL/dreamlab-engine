import { Behavior, Rigidbody, value } from "@dreamlab/engine";

export default class Ball extends Behavior {
  #rigidbody = this.entity.cast(Rigidbody);

  @value()
  linearDamping: number = 10;

  @value()
  angularDamping: number = 10;

  #lastHandle: number | undefined;
  #setDamping(): void {
    if (!this.hasAuthority(true)) return;

    const body = this.#rigidbody.body;
    this.#lastHandle = body.handle;

    this.#rigidbody.body.setLinearDamping(this.linearDamping);
    this.#rigidbody.body.setAngularDamping(this.angularDamping);
  }

  onInitialize(): void {
    this.#setDamping();

    const onChanged = () => this.#setDamping();
    this.values.get("linearDamping")?.onChanged(onChanged);
    this.values.get("angularDamping")?.onChanged(onChanged);
  }

  onTick(): void {
    const handle = this.#rigidbody.body.handle;
    if (handle !== this.#lastHandle) this.#setDamping();
  }
}
