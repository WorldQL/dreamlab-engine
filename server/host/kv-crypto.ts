import {
  decodeBase64Url,
  encodeBase64Url,
} from "https://deno.land/std@0.218.2/encoding/base64url.ts";
import {
  getPublicKeyAsync,
  signAsync,
  verifyAsync,
} from "https://deno.land/x/ed25519@2.0.0/mod.ts";

/**
 * Payload data.
 */
export type Payload = {
  expires: Date;
  action: "get" | "set" | "delete";
  scope: string;
  key: string;
};

/**
 * Create a payload object.
 *
 * @param action Requested action
 * @param scope Scope
 * @param key Key
 * @param lifetime Number of seconds from now that this payload will be valid
 */
export function createPayload(
  action: Payload["action"],
  scope: string,
  key: string,
  lifetime: number,
): Payload {
  if (lifetime < 1) {
    throw new Error("must be valid for at least 1 second");
  }

  const expires = new Date(Date.now() + lifetime * 1000);
  return {
    expires,
    action,
    scope,
    key,
  };
}

function serialize({ expires, action, scope, key }: Payload): string {
  const salt = new Uint8Array(8);
  crypto.getRandomValues(salt);

  const array = [expires.getTime(), action, scope, key, encodeBase64Url(salt)];
  const bytes = new TextEncoder().encode(JSON.stringify(array));

  return encodeBase64Url(bytes);
}

function deserialize(payload: string): Payload {
  const bytes = new TextDecoder().decode(decodeBase64Url(payload));
  const json = JSON.parse(bytes);

  const error = new Error("invalid payload");
  if (!Array.isArray(json) || json.length < 4) throw error;

  const [expires, action, scope, key] = json;
  if (typeof expires !== "number") throw error;
  if (typeof action !== "string") throw error;
  if (action !== "get" && action !== "set" && action !== "delete") throw error;
  if (typeof scope !== "string") throw error;
  if (typeof key !== "string") throw error;

  return { expires: new Date(expires), action, scope, key };
}

/**
 * Sign and encode payload data.
 *
 * @param key Secret ed25519 key
 * @param payload Payload data
 * @returns Encoded payload and signature
 *
 * @example
 * ```ts
 * import { createPayload, sign } from "./crypto.ts";
 *
 * // Generate a random signing key
 * const key = new Uint8Array(32);
 * crypto.getRandomValues(key);
 *
 * const data = createPayload("get", "scope", "key", 10);
 * const { payload, sig } = await sign(key, data);
 * ```
 */
export async function sign(
  key: Uint8Array,
  payload: Payload,
): Promise<{ payload: string; sig: string }> {
  const serialized = serialize(payload);
  const signed = await signAsync(new TextEncoder().encode(serialized), key);

  return {
    payload: serialized,
    sig: encodeBase64Url(signed),
  };
}

/**
 * Generate a pre-signed URL.
 *
 * @param baseUrl Base API URL
 * @param key Secret ed25519 key
 * @param payload Payload data
 *
 * @example
 * ```ts
 * import { createPayload, presign } from "./crypto.ts";
 *
 * // Generate a random signing key
 * const key = new Uint8Array(32);
 * crypto.getRandomValues(key);
 *
 * const data = createPayload("get", "scope", "key", 10);
 * const url = await presign("http://localhost:3000", key, data);
 * ```
 */
export async function presign(
  baseUrl: string,
  key: Uint8Array,
  payload: Payload,
): Promise<string> {
  const url = new URL(baseUrl);
  url.pathname = `/kv/${payload.scope}/${payload.key}`;

  const { payload: serialized, sig } = await sign(key, payload);
  url.searchParams.set("payload", serialized);
  url.searchParams.set("sig", sig);

  return url.toString();
}

/**
 * Verify and decode payload and signature pair.
 *
 * @param key Secret ed25519 key
 * @param payload Encoded payload
 * @param signature Encoded signature
 * @returns Decoded payload data
 *
 * @example
 * ```ts
 * import { verify } from "./crypto.ts";
 *
 * // Generate a random signing key
 * // Must be the same key used to generate the signature
 * const key = new Uint8Array(32);
 * crypto.getRandomValues(key);
 *
 * const encodedPayload = "...";
 * const signature = "...";
 *
 * const payload = await verify(key, encodedPayload, signature);
 * if (!payload) throw new Error("invalid signature");
 * ```
 */
export async function verify(
  key: Uint8Array,
  payload: string,
  signature: string,
): Promise<Payload | undefined> {
  const bytes = new TextEncoder().encode(payload);
  const sig = decodeBase64Url(signature);

  const pub = await getPublicKeyAsync(key);
  const valid = await verifyAsync(sig, bytes, pub);
  if (!valid) return undefined;

  const deserialized = deserialize(payload);
  if (Date.now() > deserialized.expires.getTime()) return undefined;

  return deserialized;
}
