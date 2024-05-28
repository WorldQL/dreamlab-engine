import type { IKeyValue } from "./mod.ts";

export class LocalKeyValue implements IKeyValue {
  #store = new Map<string, string>();

  private scoped(scope: string, key: string): string {
    return `${scope}:${key}`;
  }

  public get(
    scope: string,
    key: string,
  ): string | undefined {
    return this.#store.get(this.scoped(scope, key));
  }

  public set(scope: string, key: string, value: string): void {
    this.#store.set(this.scoped(scope, key), value);
  }

  public incr(
    scope: string,
    key: string,
    by: number | undefined = 1,
  ): string | undefined {
    const str = this.get(scope, key) ?? "0";
    const value = Number.parseFloat(str);
    if (Number.isNaN(value)) return undefined;

    const final = (value + by).toString();
    this.set(scope, key, final);

    return final;
  }

  public append(
    scope: string,
    key: string,
    value: string,
  ): string | undefined {
    const current = this.get(scope, key) ?? "";

    const final = current + value;
    this.set(scope, key, final);

    return final;
  }

  public delete(scope: string, key: string): void {
    this.#store.delete(this.scoped(scope, key));
  }
}
