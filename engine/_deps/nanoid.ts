import { customAlphabet } from "npm:nanoid@5.1.6";
import { customAlphabet as insecureCustomAlphabet } from "npm:nanoid@5.1.6/non-secure";

// modified from https://github.com/ai/nanoid/blob/main/url-alphabet/index.js
// removing - and _ from the set of characters
const CHARSET: string = "useandom26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict";

const genSecure = customAlphabet(CHARSET);
const genInsecure = insecureCustomAlphabet(CHARSET);

type Options = {
  readonly secure?: boolean;
  readonly length?: number;
};

export function createId<const T extends string>(type: T, options?: Options): `${T}_${string}`;
export function createId(options?: Options): string;
export function createId<const T extends string>(
  arg0?: T | Options,
  arg1?: Options,
): `${T}_${string}` | string {
  const isTagged = typeof arg0 === "string";
  const options = (isTagged ? arg1 : arg0) ?? {};
  const { secure = true, length } = options;

  const id = secure ? genSecure(length) : genInsecure(length);
  if (!isTagged) return id;

  return `${arg0}_${id}`;
}
