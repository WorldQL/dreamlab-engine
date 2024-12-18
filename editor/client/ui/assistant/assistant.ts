import { ClientGame, Collider, Empty, Entity, RectCollider } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { InspectorUI } from "../inspector.ts";
import {
  Book,
  Check,
  Copy,
  icon,
  PlusCircle,
  RotateCcw,
  Send,
  siCodingame,
} from "../../_icons.ts";
import { available_topics, codingPrompt, fileContents, plan, step1, step2 } from "./prompts.ts";
import markdownit from "npm:markdown-it@14.1.0";
import hljs from "npm:highlight.js/lib/core";
import typescript from "npm:highlight.js/lib/languages/typescript";
import javascript from "npm:highlight.js/lib/languages/javascript";
import {
  buildPrefabMap,
  buildScriptMap,
  getFileContent,
  getTagContents,
  oneOffMessage,
} from "./context.ts";
import { createFile } from "../../main.ts";
import { BehaviorSchema } from "@dreamlab/scene";
import { EditorMetadataEntity, Facades } from "../../../common/mod.ts";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { spawnEntity } from "./editor-world-interaction-util.ts";
import { createEntityMenu } from "../../util/entity-types.ts";
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);

export const suggestions = [
  { text: "Add a double-jump to the player" },
  { text: "Create a spike trap prefab that teleports the player back to PlayerSpawnpoint" },
  { text: "Add an enemy that chases the player" },
];

export class Assistant {
  #section = elem("section", { id: "chat-bot" }, []);
  #chatContent: HTMLDivElement;
  #chatInput: HTMLTextAreaElement;
  #sendButton: HTMLButtonElement;
  #newChatButton: HTMLButtonElement;
  #isChatbotReplying = false;

  game: ClientGame;
  container: HTMLElement;

  ui: InspectorUI | undefined;

  constructor(game: ClientGame, container: HTMLElement) {
    this.game = game;
    this.container = container;
    this.#section = elem("section", { id: "chat-bot" });
    this.#chatContent = elem("div", {
      className: "chat-content",
    }) as HTMLDivElement;
    const minRows = 1;
    const maxRows = 4;

    this.#chatInput = elem("textarea", {
      className: "chat-input",
      placeholder: "Type a message...",
      rows: minRows,
      style: "overflow-y: auto; resize: none; padding: 0.5rem; box-sizing: border-box;",
    }) as HTMLTextAreaElement;

    this.#chatInput.addEventListener("input", function () {
      // Reset the height to allow shrinkage when deleting content
      this.style.height = "auto";

      // Get computed styles for accurate measurements
      const computed = window.getComputedStyle(this);

      // Use parseFloat to handle decimal values and units like 'rem'
      const lineHeight = parseFloat(computed.lineHeight);
      const paddingTop = parseFloat(computed.paddingTop);
      const paddingBottom = parseFloat(computed.paddingBottom);
      const padding = paddingTop + paddingBottom;
      const borderTop = parseFloat(computed.borderTopWidth);
      const borderBottom = parseFloat(computed.borderBottomWidth);
      const border = borderTop + borderBottom;

      // Calculate the total height for min and max rows
      const maxHeight = lineHeight * maxRows + padding + border;

      // Set the new height, ensuring it doesn't exceed the maximum
      const newHeight = Math.min(this.scrollHeight, maxHeight);
      this.style.height = newHeight + "px";

      // If content exceeds max height, show scrollbar
      if (this.scrollHeight > maxHeight) {
        this.style.overflowY = "auto";
      } else {
        this.style.overflowY = "hidden";
      }
    });

    this.#sendButton = elem("button", { className: "send-button", title: "Send message" }, [
      icon(Send),
    ]) as HTMLButtonElement;
    this.#newChatButton = elem(
      "button",
      { className: "new-chat-button", title: "Start a new chat" },
      [icon(PlusCircle), "Clear Chat"],
    ) as HTMLButtonElement;
  }

  setup(ui: InspectorUI): void {
    // const chatHeader = elem("div", { className: "chat-header" }, [
    //   this.#newChatButton,
    //   "Tip: You can drag the divider above the tab bar to change the Assistant's size.",
    // ]);

    this.ui = ui;

    const chatInputContainer = elem("div", {
      className: "chat-input-container",
    });

    this.#sendButton.addEventListener("click", () => this.sendMessage());
    this.#chatInput.addEventListener("keypress", event => {
      if (event.key === "Enter" && !event.shiftKey && !this.#isChatbotReplying) {
        event.preventDefault();
        this.sendMessage();
      }
    });

    this.#newChatButton.onclick = () => {
      this.#chatContent.innerHTML = "";
      ScriptSession.chatContext = [];
      ScriptSession.chatState = "plan";
      this.#chatInput.value = "";
      this.#chatInput.focus();
      this.showSuggestions();
    };

    chatInputContainer.append(this.#chatInput, this.#sendButton);
    this.#section.append(this.#chatContent, chatInputContainer);

    this.#chatInput.addEventListener("keydown", function (event) {
      event.stopPropagation();
    });

    this.#chatContent.addEventListener("scroll", this.handleScroll.bind(this));
    const botMessageElement = elem("div", { className: "bot-message" }, [
      "Hi! I'm here to help you create your game. I can write code, create reusable objects you can place using the editor, and modify your scene!",
    ]);
    this.#chatContent.appendChild(botMessageElement);

    this.showSuggestions();
    this.container.append(this.#section);

    const urlParams = new URLSearchParams(window.location.search);

    const websocketServer = urlParams.get("server");
    const instance = urlParams.get("instance");

    const httpServer = websocketServer
      ? websocketServer.replace(/^wss:/, "https:").replace(/^ws:/, "http:")
      : null;

    ScriptSession.httpServer = httpServer!;
    ScriptSession.instance = instance!;

    (async () => {
      let existingScriptMap = undefined;
      try {
        existingScriptMap = await getFileContent("script-map.md");
        ScriptSession.scriptMap = existingScriptMap;
      } catch {
        // do nothing
      }

      if (existingScriptMap !== undefined) return;
      console.log("building script map!");

      const scriptMap = await buildScriptMap();
      ScriptSession.scriptMap = scriptMap;

      await createFile("script-map.md", scriptMap);
      window.parent.postMessage({ action: "reloadFile", filename: "script-map.md" }, "*");
    })();
  }

  async sendMessage(): Promise<void> {
    if (!ScriptSession.scriptMap) {
      alert("We're indexing your project! Try again in a few seconds.");
      return;
    }

    const userMessage = this.#chatInput.value.trim();
    if (userMessage) {
      this.clearSuggestions();

      const messageElement = elem("div", { className: "chat-message user" }, [
        elem("div", { className: "chat-message-content" }, [userMessage]),
      ]);
      this.#chatContent.appendChild(messageElement);

      this.#chatInput.value = "";
      this.#chatInput.style.height = "auto";

      this.#isChatbotReplying = true;
      this.#chatInput.disabled = true;
      this.#sendButton.disabled = true;
      this.#newChatButton.disabled = true;
      this.#chatInput.placeholder = "Chatbot is replying... Please wait";
      this.#chatInput.classList.add("disabled-input");

      this.#chatContent.scrollTop = this.#chatContent.scrollHeight;
      await this.fetchChatbotBehavior(userMessage);
    }
  }

  async fetchChatbotBehavior(prompt: string): Promise<void> {
    if (ScriptSession.chatState === "plan") {
      // const behaviors = [
      //   {
      //     ref: generateCUID("bhv"),
      //     script: "res://src/collisiondetect.ts",
      //     values: { foo: "4" },
      //   },
      // ];

      // spawnEntity(this.game.world._.EditEntities._.prefabs, {
      //   type: "Collider",
      //   name: "hii",
      //   behaviors: [{ script: "src/collisiondetect.ts", values: { foo: "4" } }],
      //   children: [
      //     {
      //       type: "ColoredSquare",
      //       name: "hi",
      //       values: { color: "#6678ff" },
      //       transform: { position: { x: 1, y: 0 }, rotation: 1, scale },
      //     },
      //   ],
      // });
      // return;

      // // this.game.world._.EditEntities._.prefabs.spawn({
      // //   type: RectCollider,
      // //   name: "hiiii :)",
      // //   children: [
      // //     {
      // //       type: EditorMetadataEntity,
      // //       name: "__EditorMetadata",
      // //       values: { behaviorsJson: JSON.stringify(behaviors) },
      // //     },
      // //   ],
      // // });

      // return;
      const scriptmap = ScriptSession.scriptMap;

      const prefabEditRoot = this.game.world._.EditEntities._.prefabs;
      const prefabmap = await buildPrefabMap(prefabEditRoot, this.ui!);
      console.log(prefabmap);
      const filled = plan
        .replaceAll("{{SOURCE_TREE}}", scriptmap)
        .replaceAll("{{PREFAB_TREE}}", prefabmap)
        .replaceAll("{{DOCS_TOPICS}}", available_topics)
        .replaceAll("{{USER_REQUEST}}", prompt);
      // const m = plan.replace("{{USER_REQUEST}}", prompt);
      console.log(filled);
      const p: ContextItem = { role: "user", content: filled };
      ScriptSession.chatContext.push(p);
    } else if (ScriptSession.chatState === "step1") {
      const p: ContextItem = { role: "user", content: step1 };
      ScriptSession.chatContext.push(p);
    } else if (ScriptSession.chatState === "step2") {
      ScriptSession.chatContext = [];
      let m = step2.replace("{{USER_REQUEST}}", prompt);
      m = m.replace("{{TOPIC_DOCUMENTATION}}", ScriptSession.chatDocumentation);
      m = m.replace("{{EXAMPLE_BEHAVIOR_CODE}}", fileContents["_basic-structure"]);
      const p: ContextItem = { role: "user", content: m };
      ScriptSession.chatContext.push(p);
    } else if (ScriptSession.chatState === "followup") {
      const p: ContextItem = { role: "user", content: prompt };
      ScriptSession.chatContext.push(p);
    }

    console.log(ScriptSession.chatContext);

    try {
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
        body: JSON.stringify({ context: ScriptSession.chatContext }),
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

      await this.handleStreamingResponse(reader);
    } catch (error) {
      console.error("Error in fetchChatbotBehavior:", error);
      //Toast.error("Failed to fetch chatbot! Try again later.");
      this.handleError(error);
    }

    if (ScriptSession.chatState === "step2") {
      ScriptSession.chatState = "followup";
    }
  }

  private isUserNearBottom = true;
  private observerTimeout: number | null = null;

  // #region Handle Stream
  async handleStreamingResponse(
    reader: ReadableStreamDefaultReader<Uint8Array>,
  ): Promise<void> {
    const decoder = new TextDecoder();
    let accumulatedText = "";
    const md = this.setupMarkdownIt();

    const botMessageElement = elem("div", { className: "bot-message" });
    this.#chatContent.appendChild(botMessageElement);

    const observer = new MutationObserver(this.handleMutations.bind(this));
    observer.observe(this.#chatContent, {
      childList: true,
      subtree: true,
      characterData: true,
    });

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

              const renderedContent = md.render(accumulatedText);
              this.renderContent(botMessageElement, renderedContent);
            } catch (error) {
              console.error("Error parsing JSON:", error);
            }
          }
        }
      }
    }

    ScriptSession.chatContext.push({
      role: "assistant",
      content: accumulatedText,
    });

    // if (ScriptSession.chatState !== "step0" && ScriptSession.chatState !== "step1") {
    //   this.#isChatbotReplying = false;
    //   this.#chatInput.disabled = false;
    //   this.#sendButton.disabled = false;
    //   this.#newChatButton.disabled = false; // Re-enable new chat button
    //   this.#chatInput.placeholder = "Type your message...";
    //   this.#chatInput.classList.remove("disabled-input");
    //   this.#chatInput.focus();
    // } else if (ScriptSession.chatState === "step0") {
    //   ScriptSession.chatState = "step1";
    //   this.fetchChatbotBehavior(prompt);
    // }

    console.log(ScriptSession.chatState);
    const plan = getTagContents("plan", accumulatedText);
    if (plan) {
      const p = JSON.parse(plan);
      const stepsContainer = elem("div", { className: "chat-steps-container" });

      for (const step of p) {
        const stepElement = elem("div", { className: "chat-step" }, [step.desc]);
        stepsContainer.appendChild(stepElement);
      }
      botMessageElement.appendChild(stepsContainer);

      for (const step of p) {
        if (step.action === "editEntityValue") {
          const target =
            "game.world._.EditEntities._.prefabs._" +
            step.target.split("game.prefabs._").at(-1);
          console.log(target);
          const { valueName, newValue } = step;
          console.log(target);
          const e = this.game.entities.lookupById(target);
          console.log(e);
          const valTarget = e?.values.get(valueName);
          if (valTarget) {
            valTarget.value = newValue;
          }
        }
        if (step.action === "editBehaviorValue") {
          const target =
            "game.world._.EditEntities._.prefabs._" +
            step.target.split("game.prefabs._").at(-1);
          const { script, valueName, newValue } = step;
          const e = this.game.entities.lookupById(target);

          const editorMetadata = e?.children
            .get("__EditorMetadata")
            ?.cast(EditorMetadataEntity);
          if (!editorMetadata || !e) {
            return;
          }

          const behaviors = BehaviorSchema.array().parse(
            JSON.parse(editorMetadata.behaviorsJson),
          );

          const targetScript = behaviors.find(e => e.script == "res://" + script);
          if (!targetScript) return;

          targetScript.values[valueName] = newValue;
          editorMetadata.behaviorsJson = JSON.stringify(behaviors);

          const valTarget = e?.values.get(valueName);
          if (valTarget) {
            valTarget.value = newValue;
          }
        }

        if (step.action === "createPrefab") {
          spawnEntity(this.game.world._.EditEntities._.prefabs, step.definition);
        }

        if (step.action === "createFile") {
          const fileUrl = new URL(ScriptSession.httpServer);
          const { addToContext, loadDocs, instructions, target } = step;
          console.log(step);
          const filesLoaded = [];
          for (const filePath of addToContext ?? []) {
            fileUrl.pathname = `/api/v1/edit/${ScriptSession.instance}/files/${filePath}`;
            const fileText = await (await fetch(fileUrl.toString())).text();
            filesLoaded.push([filePath, fileText]);
          }
          // alphabetically sort by first element of key/value pairs
          const alphasort = (a: string[], b: string[]) => {
            if (a[0] < b[0]) return -1;
            if (a[0] > b[0]) return 1;
            return 0;
          };
          filesLoaded.sort(alphasort);
          console.log("filesloaded:");
          console.log(filesLoaded);

          const topicsLoaded = [];

          for (const docTopic of loadDocs ?? []) {
            const text: string = fileContents[docTopic];
            topicsLoaded.push([docTopic, text]);
          }
          topicsLoaded.sort(alphasort);
          topicsLoaded.unshift(["Basic Behavior Structure", fileContents["_basic-structure"]]);

          // prepare strings for the LLM context
          let contextFiles = "";
          let docCodeSamples = "";

          for (const [title, body] of topicsLoaded) {
            docCodeSamples += `${title}:\n${body}\n\n`;
          }

          for (const [path, code] of filesLoaded) {
            contextFiles += `${path}:\n${code}\n\n`;
          }

          const prepared = codingPrompt
            .replaceAll("{{CONTEXT_FILES}}", contextFiles)
            .replaceAll("{{CODE_SAMPLES}}", docCodeSamples)
            .replaceAll("{{EXISTING_FILE}}", "")
            .replaceAll("{{FILE_INSTRUCTIONS}}", instructions);

          console.log(prepared);
          const result = await oneOffMessage(prepared);
          console.log(result);
          const code = getTagContents("code", result);
          if (code) {
            await createFile(target, code);
            window.parent.postMessage({ action: "reloadFile", filename: "script-map.md" }, "*");
          }
        }
      }
    }
    ScriptSession.chatState = "followup";

    this.#isChatbotReplying = false;
    this.#chatInput.disabled = false;
    this.#sendButton.disabled = false;
    this.#newChatButton.disabled = false; // Re-enable new chat button
    this.#chatInput.placeholder = "Type your message...";
    this.#chatInput.classList.remove("disabled-input");
    this.#chatInput.focus();

    observer.disconnect();
  }
  // #endregion

  setupMarkdownIt(): markdownit {
    return markdownit({
      highlight: function (str: string, lang: string) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(str, { language: lang }).value;
          } catch (__) {
            // dont blow up
          }
        }
        return ""; // use external default escaping
      },
      html: true,
      breaks: true,
      linkify: true,
    });
  }

  handleSelectedTopics(
    botMessageElement: HTMLElement,
    topicsText: string,
    prompt: string,
  ): void {
    const topics = topicsText
      .split("\n")
      .filter(
        line => line.trim() !== "<selected_topics>" && line.trim() !== "</selected_topics>",
      );

    const list = elem("ul", { className: "selected-topics-list" });
    let collectedDocumentation = "";

    topics.forEach(topic => {
      const listItem = elem("li", {}, [
        elem("span", { className: "topic-icon" }, [icon(Check)]),
        elem("span", { className: "topic-text" }, [topic]),
      ]);
      list.appendChild(listItem);

      if (topic in fileContents) {
        collectedDocumentation += `\`\`\`typescript
  ${(fileContents as any)[topic]}
  \`\`\`\n`;
      } else {
        console.warn("Tried to look up topic not in docs!");
      }
    });

    const chatMetaBox = elem("div", { className: "chat-meta-box" }, [
      elem("div", { className: "chat-meta-header" }, [
        icon(Book),
        elem("span", {}, ["Fetched documentation:"]),
      ]),
      list,
    ]);

    botMessageElement.appendChild(chatMetaBox);

    ScriptSession.chatDocumentation = collectedDocumentation;
    ScriptSession.chatState = "step2";
    this.fetchChatbotBehavior(prompt);
  }

  // TODO: make sure this doesn't cause too much load
  private handleMutations(): void {
    if (this.observerTimeout) {
      clearTimeout(this.observerTimeout);
    }

    this.observerTimeout = setTimeout(() => {
      if (this.isUserNearBottom) {
        this.scrollToBottom();
      }
    }, 10);
  }

  private scrollToBottom(): void {
    this.#chatContent.scrollTop = this.#chatContent.scrollHeight;
  }

  private isNearBottom(): boolean {
    const threshold = 30;
    return (
      this.#chatContent.scrollHeight - this.#chatContent.scrollTop <=
      this.#chatContent.clientHeight + threshold
    );
  }

  renderContent(botMessageElement: HTMLElement, renderedContent: string): void {
    if (renderedContent.includes("<pre><code")) {
      const textParts = renderedContent.split(/<pre><code.*?>|<\/code><\/pre>/);

      botMessageElement.innerHTML = "";

      for (let i = 0; i < textParts.length; i++) {
        if (i % 2 === 0) {
          const textElement = elem("p", {}, []);
          textElement.innerHTML = textParts[i];
          botMessageElement.appendChild(textElement);
        } else {
          const codeContainer = elem("div", { className: "code-container" });
          const codeHeader = elem("div", { className: "code-header" });
          const copyButton = elem("button", { className: "copy-button" }, [
            icon(Copy),
            document.createTextNode(" Copy"),
          ]);

          copyButton.onclick = () => {
            console.log("copybutton");
            const tempElement = document.createElement("div");
            tempElement.innerHTML = textParts[i];
            const plainText = tempElement.textContent || tempElement.innerText;
            navigator.clipboard.writeText(plainText);
            copyButton.innerHTML = "";
            copyButton.appendChild(icon(Check));
            copyButton.appendChild(document.createTextNode(" Copied!"));
            setTimeout(() => {
              copyButton.innerHTML = "";
              copyButton.appendChild(icon(Copy));
              copyButton.appendChild(document.createTextNode(" Copy"));
            }, 2000);
          };

          codeHeader.appendChild(copyButton);
          codeContainer.appendChild(codeHeader);

          const codeBox = elem("pre", {}, []);
          codeBox.innerHTML = textParts[i];
          codeContainer.appendChild(codeBox);
          botMessageElement.appendChild(codeContainer);
        }
      }
    } else {
      botMessageElement.innerHTML = renderedContent;
    }
  }

  private handleScroll(): void {
    this.isUserNearBottom = this.isNearBottom();
  }

  handleError(error: unknown): void {
    console.error("Error:", error);
    // Toast.error("Failed to fetch chatbot! Try again later.");

    const lastBotMessage = this.#chatContent.querySelector(".bot-message:last-of-type");
    lastBotMessage?.remove();

    const botMessageElement = elem("div", { className: "bot-message" });

    let errorMessage = "Oops! Something went wrong. Please try again later.";

    if (error instanceof Error) {
      errorMessage += error.message;
    }

    const errorParagraph = elem("p", {}, [errorMessage]);

    const retryButton = elem("button", { className: "retry-button" }, [
      icon(RotateCcw),
      elem("span", {}, ["Retry"]),
    ]);

    retryButton.onclick = () => {
      botMessageElement.remove();

      if (
        ScriptSession.chatContext.length > 0 &&
        ScriptSession.chatContext[ScriptSession.chatContext.length - 1].role === "user"
      ) {
        const lastUserMessage = ScriptSession.chatContext.pop();
        this.fetchChatbotBehavior(lastUserMessage!.content);
      }
    };

    botMessageElement.appendChild(errorParagraph);
    botMessageElement.appendChild(retryButton);
    this.#chatContent.appendChild(botMessageElement);
  }

  showSuggestions(): void {
    const suggestionsContainer = elem("div", {
      className: "suggestions-container",
    });
    const shuffledSuggestions = this.shuffleArray(suggestions).slice(0, 5);

    shuffledSuggestions.forEach(suggestion => {
      const suggestionElement = elem("div", { className: "suggestion-message" }, [
        elem("span", { className: "suggestion-message-text" }, [suggestion.text]),
      ]);

      suggestionElement.addEventListener("click", () => {
        this.#chatInput.value = suggestion.text;
        this.clearSuggestions();
        this.sendMessage();
      });
      suggestionsContainer.appendChild(suggestionElement);
    });

    this.#chatContent.appendChild(suggestionsContainer);
  }

  clearSuggestions(): void {
    const suggestions = this.#chatContent.querySelectorAll(".suggestion-message");
    suggestions.forEach(suggestion => suggestion.remove());
  }

  shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export interface ContextItem {
  role: "user" | "assistant";
  content: string;
}

export type ChatbotContext = ContextItem[];
export class ScriptSession {
  public static chatContext: ChatbotContext = [];
  public static chatState: "plan" | "step1" | "step2" | "followup" = "plan";
  public static chatDocumentation: string = "";
  public static httpServer: string;
  public static instance: string;
  public static scriptMap: string;
}
