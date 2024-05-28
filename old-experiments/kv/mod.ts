export interface IKeyValue {
  get(
    scope: string,
    key: string,
  ): string | undefined | Promise<string | undefined>;

  set(scope: string, key: string, value: string): void | Promise<void>;

  incr(
    scope: string,
    key: string,
    by?: number,
  ): string | undefined | Promise<string | undefined>;

  append(
    scope: string,
    key: string,
    value: string,
  ): string | undefined | Promise<string | undefined>;

  delete(scope: string, key: string): void | Promise<void>;
}

export * from "./local.ts";
