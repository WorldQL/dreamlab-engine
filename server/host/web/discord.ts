import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { Middleware, Router } from "oak";
import { z } from "zod";

import { APP_CONFIG } from "../config.ts";
import { createInstance, RunningInstance } from "../instance/mod.ts";
import { AuthToken } from "../instance/game/auth.ts";

type AuthRequest = z.infer<typeof AuthRequestSchema>;
const AuthRequestSchema = z.object({
  application_id: z.string().min(1),
  instance_id: z.string().min(1),
  code: z.string().min(1),
});

type AuthResponse = z.infer<typeof AuthResponseSchema>;
const AuthResponseSchema = z.object({
  discord_token: z.string().min(1),
  dreamlab_token: z.string().min(1),
  info: z.record(z.string(), z.unknown()),
});

type DetailsResponse = z.infer<typeof DetailsResponseSchema>;
const DetailsResponseSchema = z.object({
  id: z.string(),
  secret: z.string(),
  world: z.string(),
  world_revision: z.string().optional(),
});

type DiscordResponse = z.infer<typeof DiscordResponseSchema>;
const DiscordResponseSchema = z.object({
  token_type: z.string(),
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
});

type DiscordUser = z.infer<typeof DiscordUserSchema>;
const DiscordUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  global_name: z.string().nullable(),
});

type DreamlabUser = z.infer<typeof DreamlabUserSchema>;
const DreamlabUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
});

const userInfo = async (
  profile: DiscordUser,
): Promise<{ player_id: string; nickname: string }> => {
  try {
    const params = new URLSearchParams();
    params.set("discordId", profile.id);

    const url = `${APP_CONFIG.dreamlabNextUrl}/api/applications/lookup-user?${params}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${APP_CONFIG.coordAuthSecret}` },
    });

    if (!resp.ok) {
      console.log(resp);
      throw new Error("failed to lookup user");
    }

    const user = DreamlabUserSchema.parse(await resp.json());
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

class DiscordError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message);
  }
}

const handleErrors: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    if (!(error instanceof DiscordError)) throw error;

    ctx.response.status = 500;
    ctx.response.body = { code: error.code, message: error.message };
  }
};

export const discordRoutes = (
  router: Router,
  instances: Map<string, RunningInstance>,
  gameAuthSecret: CryptoKey,
) => {
  router.post("/api/v1/discord/auth", handleErrors, async ctx => {
    const body = AuthRequestSchema.parse(await ctx.request.body({ type: "json" }).value);

    const detailsResp = await fetch(
      `${APP_CONFIG.dreamlabNextUrl}/api/applications/details/${body.application_id}`,
      { headers: { Authorization: `Bearer ${APP_CONFIG.coordAuthSecret}` } },
    );

    if (detailsResp.status === 404) {
      throw new DiscordError("unknown_app_id", "unknown app id");
    }

    if (!detailsResp.ok) {
      throw new DiscordError("details_fetch_failed", "failed to fetch details");
    }

    const details = DetailsResponseSchema.parse(await detailsResp.json());

    const resp = await fetch("https://discord.com/api/oauth2/token", {
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

    if (!resp.ok) {
      throw new DiscordError("discord_oauth_failed", "failed to authenticate user");
    }

    // Retrieve the access_token from the response
    const json = DiscordResponseSchema.parse(await resp.json());
    const { access_token } = json;

    const userResp = await fetch(`https://discord.com/api/v10/users/@me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResp.ok) {
      throw new DiscordError("user_fetch_failed", "failed to fetch discord user profile");
    }

    const user = DiscordUserSchema.parse(await userResp.json());
    const info = await userInfo(user);
    const claims = {
      instance_id: body.instance_id,
      world: details.world,
      ...info,
    } satisfies AuthToken;

    const instanceId = body.instance_id;
    if (!instances.has(instanceId)) {
      const instance = createInstance(instanceId, details.world, "discord", {
        startedBy: info.player_id,
        closeOnEmpty: true,
        publicURLBase: `https://${details.id}.discordsays.com/mp`,
        worldRevision: details.world_revision,
      });

      instances.set(instanceId, instance);
    }

    const instance = instances.get(instanceId);
    if (!instance) {
      throw new DiscordError("instance_start_failed", "failed to start instance");
    }

    await instance.booted();
    const dreamlab_token = await create({ alg: "HS256" }, claims, gameAuthSecret);

    const response = {
      discord_token: access_token,
      dreamlab_token,
      info: instance.info(),
    } satisfies AuthResponse;

    ctx.response.body = response;
  });
};
