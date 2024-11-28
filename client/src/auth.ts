import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { z } from "@dreamlab/vendor/zod.ts";
import { jwtDecode } from "npm:jwt-decode";
import { connectionDetails } from "./util/server-url.ts";

type AuthToken = {
  nickname: string;
  playerId: string;
  token: string;
};

export const auth = async (nickname: string): Promise<AuthToken> => {
  // TODO: way to bypass?
  if (import.meta.env.IS_DEV) return devAuth(nickname);

  const searchParams = new URLSearchParams(window.location.search);
  const passedToken = searchParams.get("token");
  if (passedToken) return decodeToken(passedToken);

  const url = new URL("/api/game/auth/guest", import.meta.env.NEXT_URL);
  url.searchParams.set("id", connectionDetails.instanceId);
  url.searchParams.set("nickname", nickname);

  const resp = await fetch(url, { credentials: "include" });
  if (!resp.ok) throw new Error("failed to issue guest token");

  const jwt = await resp.text();
  return decodeToken(jwt);
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
  const playerId = window.localStorage.getItem(PLAYER_ID) ?? generateCUID("ply");
  window.localStorage.setItem(PLAYER_ID, playerId);

  return { nickname, playerId, token: "" } satisfies AuthToken;
};
