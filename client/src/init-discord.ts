import { element as elem } from "@dreamlab/ui";
import type * as z from "@dreamlab/vendor/zod.ts";

export const getClientId = () => {
  const idMatches = /^(?<id>\d+)\.discordsays\.com$/.exec(window.location.host);
  const clientId = idMatches?.groups?.id;
  if (!clientId) throw new Error("failed to grab client id from url");

  return clientId;
};

const showLoading = (): HTMLElement => {
  // disable top bar
  const topbar = document.querySelector<HTMLDivElement>("div#topbar");
  if (topbar) {
    topbar.style.display = "none";
    document.body.style.setProperty("--top-bar", "0px");
  }

  // TODO: make this look nicer
  const span = elem("span", {}, ["Loading..."]);
  span.style.fontSize = "4rem";
  span.style.fontFamily = "bold";
  span.style.fontFamily = "var(--font-sans)";

  const loading = elem("div", {}, [span]);
  loading.style.display = "flex";
  loading.style.alignItems = "center";
  loading.style.justifyContent = "center";
  loading.style.position = "absolute";
  loading.style.top = "0";
  loading.style.left = "0";
  loading.style.bottom = "0";
  loading.style.right = "0";
  loading.style.zIndex = "999999";

  document.body.appendChild(loading);

  return loading;
};

const init = async () => {
  const loading = showLoading();

  // load scripts **after** showing loading
  const main = import("./start-game.ts");
  const z = await import("@dreamlab/vendor/zod.ts");
  const { DiscordSDK } = await import("npm:@discord/embedded-app-sdk");
  const { InstanceInfoSchema } = await import("./connect-form.tsx");

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

  const { startGame } = await main;
  loading.remove();
  startGame(connectUrl, info.id, game => {
    game.cloudAssetBaseURL = "/cloud";
  });
};

await init();
