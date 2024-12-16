import { ScriptSession } from "./assistant.ts";
import { summarize } from "./prompts.ts";

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
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }
      }
    }
  }
  console.log("filesummarized");
  return accumulatedText;
}

const map: { filename: string; summary: string }[] = [];

export async function buildScriptMap() {
  return
  const fileUrl = new URL(ScriptSession.httpServer);
  fileUrl.pathname = `/api/v1/edit/${ScriptSession.instance}/files/`;

  const fileResponse = await fetch(fileUrl.toString());
  const { files } = await fileResponse.json();
  console.log(files);
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
    console.log(result);
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
  console.log(mdsummary);
}
