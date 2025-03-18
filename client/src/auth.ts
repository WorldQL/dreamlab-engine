import { createId } from "@dreamlab/vendor/nanoid.ts";
import { z } from "@dreamlab/vendor/zod.ts";
import { jwtDecode } from "npm:jwt-decode";
import { connectionDetails } from "./util/server-url.ts";

type AuthToken = {
  nickname: string;
  playerId: string;
  token: string;
};

const authToken = async (): Promise<AuthToken> => {
  const url = new URL("/api/game/auth/token", globalThis.env.DREAMLAB_NEXT_PUBLIC_URL);
  url.searchParams.set("id", connectionDetails.instanceId);

  const resp = await fetch(url, { credentials: "include" });
  if (!resp.ok) throw new Error("failed to issue auth token");

  const jwt = await resp.text();
  return decodeToken(jwt);
};

const authGuest = async (nickname: string): Promise<AuthToken> => {
  const url = new URL("/api/game/auth/guest", globalThis.env.DREAMLAB_NEXT_PUBLIC_URL);
  url.searchParams.set("id", connectionDetails.instanceId);
  url.searchParams.set("nickname", nickname);

  const resp = await fetch(url, { credentials: "include" });
  if (!resp.ok) throw new Error("failed to issue guest token");

  const jwt = await resp.text();
  return decodeToken(jwt);
};

export const auth = async (nickname: string): Promise<AuthToken> => {
  // TODO: way to bypass?
  if (globalThis.env.IS_DEV || globalThis.env.DREAMLAB_MULTIPLAYER_STANDALONE)
    return devAuth(nickname);

  const searchParams = new URLSearchParams(window.location.search);
  const passedToken = searchParams.get("token");
  if (passedToken) return decodeToken(passedToken);

  const [token, guest] = await Promise.allSettled([authToken(), authGuest(nickname)]);
  if (token.status === "fulfilled") return token.value;
  if (guest.status === "fulfilled") return guest.value;

  throw new Error("failed to issue auth token");
};

const TokenSchema = z.object({
  instance_id: z.string().uuid(),
  nickname: z.string(),
  player_id: z.string(),

  // this is not functional currently
  // world: z.string(),
});

const decodeToken = (token: string): AuthToken => {
  const claims = TokenSchema.parse(jwtDecode(token));

  return {
    token,
    nickname: claims.nickname,
    playerId: claims.player_id,
  };
};

const devAuth = (nickname: string): AuthToken => {
  const PLAYER_ID = "dreamlab/player-id";
  const playerId = window.localStorage.getItem(PLAYER_ID) ?? createId("ply");
  window.localStorage.setItem(PLAYER_ID, playerId);

  return { nickname, playerId, token: "" } satisfies AuthToken;
};
