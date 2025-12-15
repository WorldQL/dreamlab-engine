// You can disable with DISABLE_ANALYTICS=1 in env

import { promises as fs } from "node:fs";
import * as path from "node:path";
import os from "node:os";
import { v7 as uuidv7 } from "npm:uuid@13.0.0";

async function getOrCreateUUID(): Promise<string> {
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
  if (!homeDir) {
    throw new Error("Could not determine home directory");
  }

  const configDir = path.join(homeDir, ".worldql-dreamlab-engine");
  const uuidFile = path.join(configDir, ".uuid");

  try {
    const uuid = await fs.readFile(uuidFile, "utf-8");
    return uuid.trim();
  } catch (_error) {
    const newUuid = uuidv7();
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(uuidFile, newUuid, "utf-8");
    return newUuid;
  }
}

function getOSInfo(): string {
  try {
    const platform = os.platform();
    const release = os.release();
    const arch = os.arch();
    return `${platform} ${release} ${arch}`;
  } catch (_error) {
    return "Unknown OS";
  }
}

async function sendPosthogEvent(eventName: string) {
  try {
    if (Deno.env.get("DISABLE_ANALYTICS")) {
      return;
    }

    const distinctId = await getOrCreateUUID();
    const osInfo = getOSInfo();

    const url = "https://us.i.posthog.com/i/v0/e/";
    const headers = {
      "Content-Type": "application/json",
    };
    const payload = {
      api_key: "phc_NQfaeSq62U8nN9YM9AdvKvVZrVckFw4rQAE2dUteyYQ",
      event: eventName,
      distinct_id: distinctId,
      properties: {
        os: osInfo,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    console.log(await response.json());
  } catch (_error) {
    // silently fail
  }
}

sendPosthogEvent("WorldQL CLI Launched!");
