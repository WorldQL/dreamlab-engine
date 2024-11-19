import type { ClientGame, ServerGame } from "../game.ts";
import type { JsonValue } from "../value/data.ts";

export function scope(game: ClientGame | ServerGame, playerId?: string): string {
  const world = "WORLD"; // TODO: Get current world ID from game

  if (!playerId) return world;
  return `${world}:${playerId}`;
}

export async function get(presigned: string): Promise<JsonValue | undefined> {
  const resp = await fetch(presigned);
  if (resp.status === 404) return undefined;

  const json = await resp.json();
  if (!("value" in json) || typeof json.value !== "string") {
    throw new TypeError("invalid kv response");
  }

  const value = JSON.parse(json.value) as JsonValue;
  return value;
}

export async function set(presigned: string, value: JsonValue): Promise<void> {
  await fetch(presigned, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: JSON.stringify(value) }), // lol, see comments in mod.ts
  });

  // TODO: error handling?
}

export async function del(presigned: string): Promise<void> {
  await fetch(presigned, { method: "DELETE" });

  // TODO: error handling?
}
