import { decode, verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { z } from "zod";

export const AuthTokenSchema = z.object({
  instance_id: z.string(),
  world: z.string(),

  player_id: z.string(),
  nickname: z.string(),
  guest: z.boolean().optional(),
});

export type AuthToken = z.infer<typeof AuthTokenSchema>;

export const importSecretKey = async (key: string): Promise<CryptoKey> => {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    {
      name: "HMAC",
      hash: { name: "SHA-256" },
    },
    false,
    ["sign", "verify"],
  );
};

/**
 * @throws {Error}
 */
export const validateAuthToken = async (
  secret: CryptoKey,
  token: string,
): Promise<AuthToken> => {
  const payload = await verify(token, secret);
  return AuthTokenSchema.parse(payload as unknown);
};

/**
 * WARNING: Does not check for token validity!!
 */
export const unsafeDecodeAuthToken = (token: string): AuthToken | undefined => {
  try {
    const [_header, contents, _signature] = decode(token);
    return AuthTokenSchema.parse(contents);
  } catch (_err) {
    return undefined;
  }
};
