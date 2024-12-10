const params = new URLSearchParams(window.location.search);
if (params.has("frame_id")) {
  const { patchUrlMappings } = await import("npm:@discord/embedded-app-sdk");
  patchUrlMappings([]);
}

await import("./main.ts");
