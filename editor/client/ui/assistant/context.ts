import type { Entity, JsonArray, JsonObject, Primitive } from "@dreamlab/engine";
import { ScriptSession } from "./assistant.ts";
import { summarize } from "./prompts.ts";
import { EditorMetadataEntity } from "../../../common/mod.ts";
import { BehaviorSchema } from "@dreamlab/scene";
import type { InspectorUI } from "../inspector.ts";
import type { Values } from "@dreamlab/vendor/zod.ts";

async function handleStreamingResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<string> {
  const decoder = new TextDecoder();
  let accumulatedText = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const chunk = decoder.decode(value);
    const events = chunk.split("\n\n");

    for (const event of events) {
      if (event.trim() !== "") {
        const [, data] = event.split("data: ");
        if (data) {
          try {
            const d = JSON.parse(data);
            if (d.done) break;

            if (d.error) throw new Error(d.error);

            let line: string = d.text;
            accumulatedText += line;
            console.log(accumulatedText)
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }
      }
    }
  }
  return accumulatedText;
}

const map: { filename: string; summary: string }[] = [];

export async function buildScriptMap() {
  const fileUrl = new URL(ScriptSession.httpServer);
  fileUrl.pathname = `/api/v1/edit/${ScriptSession.instance}/files/`;

  const fileResponse = await fetch(fileUrl.toString());
  const { files } = await fileResponse.json();
  for (const file of files) {
    if (file === "project.json" || file.split(".").pop() !== "ts") continue;
    fileUrl.pathname = `/api/v1/edit/${ScriptSession.instance}/files/${file}`;
    const fileText = await (await fetch(fileUrl.toString())).text();

    const url = new URL(window.location.href);
    const chatURL =
      url.hostname === "code-editor.dreamlab.gg"
        ? "https://app.dreamlab.gg/api/chatbot/chat"
        : "http://localhost:3000/api/chatbot/chat";

    const response = await fetch(chatURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context: [
          { role: "user", content: summarize.replaceAll("{{TYPESCRIPT_FILE}}", fileText) },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      //Toast.error("Chatbot failed! Try again later.");
      throw new Error("Unable to read response body");
    }

    const result = await handleStreamingResponse(reader);
    map.push({ filename: file, summary: result });
  }

  let mdsummary = "";
  const parser = new DOMParser();
  for (const file of map) {
    const { filename, summary } = file;
    mdsummary += `- ${filename}\n`;
    const doc = parser.parseFromString(summary, "application/xml");
    const s = doc.getElementsByTagName("summary")[0].childNodes[0].nodeValue?.trim();
    mdsummary += `\t- ${s}\n`;
  }
  return mdsummary;
}

export async function buildPrefabMap(prefabEditRoot: Entity, ui: InspectorUI) {
  type ValuesSummary = Record<string, Primitive | JsonArray | JsonObject>;
  interface BehaviorEntry {
    path: string;
    values: ValuesSummary;
  }
  interface PrefabMapEntry {
    id: string;
    type: string;
    children?: PrefabMapEntry[];
    behaviors: BehaviorEntry[];
    values: ValuesSummary;
  }

  async function buildEntryForEntity(entity: Entity): Promise<PrefabMapEntry | null> {
    const editorMetadata = entity.children.get("__EditorMetadata")?.cast(EditorMetadataEntity);
    if (!editorMetadata) {
      return null;
    }

    const behaviors = BehaviorSchema.array().parse(JSON.parse(editorMetadata.behaviorsJson));
    const behaviorEntries: BehaviorEntry[] = [];
    // we never want the chatbot to be exposed to the EditEntities tree.
    let id = entity.id.split("game.world._.EditEntities._.prefabs._").at(-1)!;
    id = "game.prefabs._" + id;

    const valuesMap: ValuesSummary = {};
    for (const [k, v] of entity.values) {
      if (k === "clonedFromRef") continue;
      valuesMap[k] = v.value ?? undefined;
    }

    for (const behavior of behaviors) {
      const scriptPath = behavior.script.split("res://").pop()!;
      const info = await ui.behaviorTypeInfo.get(behavior.script);
      const wipValues = behavior.values;

      // Add default values if missing
      for (const v of info.values) {
        if (!(v.key in wipValues)) {
          wipValues[v.key] = v.default ?? "";
        }
      }

      behaviorEntries.push({ path: scriptPath, values: wipValues });
    }

    const entityType = facadeToEntityTypeName(entity.constructor.name);

    const childEntries: PrefabMapEntry[] = [];
    for (const [_, child] of entity.children) {
      const childEntry = await buildEntryForEntity(child);
      if (childEntry) {
        childEntries.push(childEntry);
      }
    }

    const entry: PrefabMapEntry = {
      id: id,
      type: entityType,
      behaviors: behaviorEntries,
      values: valuesMap,
    };

    if (childEntries.length > 0) {
      entry.children = childEntries;
    }

    return entry;
  }

  const prefabsMap: PrefabMapEntry[] = [];

  // Process all top-level children of the prefabEditRoot
  for (const [_, child] of prefabEditRoot.children) {
    const entry = await buildEntryForEntity(child);
    if (entry) {
      prefabsMap.push(entry);
    }
  }

  return JSON.stringify(pruneEmptyObjectsAndArrays(prefabsMap));
}

function facadeToEntityTypeName(editEntityConstructorName: string) {
  if (editEntityConstructorName === "EditorFacadeCamera") return "Camera";
  if (editEntityConstructorName === "EditorFacadeRectCollider") return "RectCollider";
  if (editEntityConstructorName === "EditorFacadeCollider") return "Collider";

  return editEntityConstructorName;
}

function pruneEmptyObjectsAndArrays(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    // If it's an array, clean each element and then filter out any undefined results
    const cleanedArray = obj
      .map(pruneEmptyObjectsAndArrays) // Recursively clean each element
      .filter(val => val !== undefined);

    // If the array is empty after cleaning, return undefined to signify removal
    return cleanedArray.length > 0 ? cleanedArray : undefined;
  } else if (obj !== null && typeof obj === "object") {
    // If it's an object, iterate over its properties
    const entries = Object.entries(obj)
      .map(([key, value]) => [key, pruneEmptyObjectsAndArrays(value)] as const) // Clean each value
      .filter(([, cleanedVal]) => cleanedVal !== undefined); // Remove empty entries

    // If no entries remain, return undefined
    if (entries.length === 0) {
      return undefined;
    }

    // Otherwise, reconstruct the cleaned object
    return Object.fromEntries(entries);
  }

  // For primitive values, return them as-is
  return obj;
}

export async function oneOffMessage(prompt: string) {
  const url = new URL(window.location.href);
  const chatURL =
    url.hostname === "code-editor.dreamlab.gg"
      ? "https://app.dreamlab.gg/api/chatbot/chat"
      : "http://localhost:3000/api/chatbot/chat";

  const response = await fetch(chatURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    //Toast.error("Chatbot failed! Try again later.");
    throw new Error("Unable to read response body");
  }

  const result = await handleStreamingResponse(reader);
  return result;
}

export function getTagContents(tagName: string, xmlString: string): string | null {
  // Create a dynamic regex that matches <tagName> ... </tagName>
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i");
  const match = xmlString.match(regex);
  return match ? match[1].trim() : null;
}
export async function getFileContent(fileName: string): Promise<string> {
  const url = `${ScriptSession.httpServer}api/v1/edit/${ScriptSession.instance}/files/${fileName}`;
  const headers = {
    Authorization: `Bearer foobar`,
  };

  const response = await fetch(url, {
    method: "GET",
    headers: headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch file content: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}
