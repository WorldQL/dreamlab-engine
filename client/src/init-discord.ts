import { z } from "@dreamlab/vendor/zod.ts";
import { DiscordSDK } from "npm:@discord/embedded-app-sdk";
import { InstanceInfoSchema } from "./connect-form.ts";
import { startGame } from "./main.ts";

export const getClientId = () => {
  const idMatches = /^(?<id>\d+)\.discordsays\.com$/.exec(window.location.host);
  const clientId = idMatches?.groups?.id;
  if (!clientId) throw new Error("failed to grab client id from url");

  return clientId;
};

const init = async () => {
  const clientId = getClientId();

  const sdk = new DiscordSDK(clientId);
  await sdk.ready();
  await sdk.commands.encourageHardwareAcceleration();

  const { code } = await sdk.commands.authorize({
    client_id: sdk.clientId,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: ["identify", "guilds"],
  });

  type AuthRequest = z.infer<typeof AuthRequestSchema>;
  const AuthRequestSchema = z.object({
    application_id: z.string().min(1),
    instance_id: z.string().min(1),
    code: z.string().min(1),
  });

  const AuthResponseSchema = z.object({
    discord_token: z.string().min(1),
    dreamlab_token: z.string().min(1),
    info: InstanceInfoSchema,
    user_info: z.object({
      player_id: z.string(),
      nickname: z.string(),
    }),
  });

  const resp = await fetch("/mp/api/v1/discord/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      application_id: sdk.clientId,
      instance_id: sdk.instanceId,
      code,
    } satisfies AuthRequest),
  });

  if (!resp.ok) {
    console.log(resp);
    return;
  }

  const { discord_token, dreamlab_token, info } = AuthResponseSchema.parse(await resp.json());
  const auth = await sdk.commands.authenticate({ access_token: discord_token });
  if (auth === null) {
    throw new Error("authenticate command failed");
  }

  const connectUrl = new URL(`wss://${sdk.clientId}.discordsays.com`);
  connectUrl.pathname = `/.proxy/mp/api/v1/connect/${info.id as string}`;
  connectUrl.searchParams.set("token", dreamlab_token);

  startGame(connectUrl, info.id, game => {
    game.cloudAssetBaseURL = "/cloud";
  });
};

await init();
