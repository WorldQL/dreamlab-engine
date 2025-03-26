import "@dreamlab/vendor/polyfills.ts";

import "./css/client.css";

import "../../build-system/live-reload.js";
import "./_env.ts";

const USE_DISCORD = new URLSearchParams(window.location.search).has("frame_id");
if (USE_DISCORD) {
  const { patchUrlMappings } = await import("npm:@discord/embedded-app-sdk");
  patchUrlMappings([]);

  void import("./init-discord.ts");
} else {
  void import("./init.tsx");
}
