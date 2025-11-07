import * as z from "@dreamlab/vendor/zod.ts";
import { Router, Status } from "@oak/oak";
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { JsonAPIError, typedJsonHandler } from "../../../common-host/web-util/api.ts";
import { AuthToken, importSecretKey } from "../../../server-common/game-auth.ts";
import { CONFIG } from "../../config.ts";
import { createInstance, GameInstance } from "../../instance.ts";
import { instanceInfo } from "../util/instance-info.ts";

const DetailsResponseSchema = z.object({
  id: z.string(),
  secret: z.string(),
  world: z.string(),
  world_revision: z.string().optional(),
});

const DiscordTokenResponseSchema = z.object({
  token_type: z.string(),
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
});

const DiscordUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  global_name: z.string().nullable(),
});

const userInfo = async (
  profile: z.infer<typeof DiscordUserSchema>,
): Promise<{ player_id: string; nickname: string }> => {
  try {
    const params = new URLSearchParams();
    params.set("discordId", profile.id);

    const url = `${CONFIG.NEXT_PUBLIC_URL}/api/applications/lookup-user?${params}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${CONFIG.MULTIPLAYER_AUTH_TOKEN}` },
    });

    if (!resp.ok) {
      console.log(resp);
      throw new Error("failed to lookup user");
    }

    const user = z
      .object({
        id: z.string(),
        displayName: z.string(),
      })
      .parse(await resp.json());
    return {
      player_id: user.id,
      nickname: user.displayName,
    };
  } catch {
    // Fallback to discord details
    return {
      player_id: `discord_${profile.id}`,
      nickname: profile.global_name ?? profile.username,
    };
  }
};

export const serveDiscordRoutes = async (router: Router) => {
  const gameAuthSecret = await importSecretKey(CONFIG.NEXT_GAME_JWT_SECRET);

  router.post(
    "/api/v1/discord/auth",
    typedJsonHandler(
      {
        body: z.object({
          application_id: z.string().min(1),
          instance_id: z.string().min(1),
          code: z.string().min(1),
        }),
        response: z.object({
          discord_token: z.string().min(1),
          dreamlab_token: z.string().min(1),
          info: z.record(z.string(), z.unknown()),
        }),
      },
      async (_ctx, { body }) => {
        const detailsResp = await fetch(
          `${CONFIG.NEXT_PUBLIC_URL}/api/applications/details/${body.application_id}`,
          { headers: { Authorization: `Bearer ${CONFIG.MULTIPLAYER_AUTH_TOKEN}` } },
        );
        if (detailsResp.status === 404)
          throw new JsonAPIError(Status.InternalServerError, "unknown app id");
        if (!detailsResp.ok)
          throw new JsonAPIError(
            Status.InternalServerError,
            "failed to fetch discord app details",
          );

        const details = DetailsResponseSchema.parse(await detailsResp.json());

        const tokenResp = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: details.id,
            client_secret: details.secret,
            grant_type: "authorization_code",
            code: body.code,
          }),
        });
        if (!tokenResp.ok)
          throw new JsonAPIError(
            Status.InternalServerError,
            "failed to authenticate discord user",
          );
        const token = DiscordTokenResponseSchema.parse(await tokenResp.json());

        const userResp = await fetch("https://discord.com/api/v10/users/@me", {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });
        if (!userResp.ok)
          throw new JsonAPIError(
            Status.InternalServerError,
            "failed to fetch discord user profile",
          );
        const user = DiscordUserSchema.parse(await userResp.json());
        const info = await userInfo(user);

        const instanceId = crypto.randomUUID();
        const claims = {
          instance_id: instanceId,
          world: details.world,
          ...info,
        } satisfies AuthToken;

        if (!GameInstance.INSTANCES.has(instanceId)) {
          const instance = createInstance({
            instanceId,
            worldId: details.world,
            worldDirectory: `${CONFIG.WORLDS_DIRECTORY}/${details.world}`,
            variant: "discord",
            discordClientId: body.application_id,
            worldRevision: details.world_revision,
          });

          GameInstance.INSTANCES.set(instanceId, instance);
        }

        const instance = GameInstance.INSTANCES.get(instanceId);
        if (!instance)
          throw new JsonAPIError(Status.InternalServerError, "failed to start instance");
        await instance.waitForSessionBoot();

        const dreamlab_token = await create({ alg: "HS256" }, claims, gameAuthSecret);

        return {
          discord_token: token.access_token,
          dreamlab_token,
          info: instanceInfo(instance),
        };
      },
    ),
  );
};
