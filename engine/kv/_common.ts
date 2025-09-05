import type { ClientGame, JsonValue, ServerGame } from "@dreamlab/engine";

export function scope(game: ClientGame | ServerGame, playerId?: string): string {
  const world = game.worldId.replaceAll("/", ":");
  if (!playerId) return world;

  return `${world}:${playerId}`;
}

export async function get(presigned: string): Promise<JsonValue | undefined> {
  const resp = await fetch(presigned);
  if (!resp.ok) throw new Error("failed to get kv");

  const json = await resp.json();
  if (!("value" in json)) {
    return undefined;
  }

  return json.value as JsonValue;
}

export async function list(presigned: string): Promise<Record<string, JsonValue>> {
  const resp = await fetch(presigned);
  if (!resp.ok) throw new Error("failed to list kv");

  const json = await resp.json();
  return json as Record<string, JsonValue>;
}

export async function set(presigned: string, value: JsonValue): Promise<void> {
  const resp = await fetch(presigned, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });

  // TODO: actual error handling?
  if (!resp.ok) console.error(resp);
}

export async function del(presigned: string): Promise<void> {
  const resp = await fetch(presigned, { method: "DELETE" });

  // TODO: actual error handling?
  if (!resp.ok) console.error(resp);
}

export async function clear(presigned: string): Promise<void> {
  const resp = await fetch(presigned, { method: "DELETE" });

  // TODO: actual error handling?
  if (!resp.ok) console.error(resp);
}
