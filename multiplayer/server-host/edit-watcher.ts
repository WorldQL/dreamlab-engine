import { debounce } from "jsr:@std/async/debounce";
import { emitScriptEditNotifications } from "./edit-notification.ts";
import { GameSession } from "./session.ts";

export async function watchForEditChanges(session: GameSession) {
  const instance = session.parent;
  const worldDir = instance.info.worldDirectory;
  const editorActionsPath = `${worldDir}/editorActions.xml`;

  ["src", "instructions"].forEach(dir =>
    Deno.mkdirSync(`${worldDir}/${dir}`, { recursive: true }),
  );

  const stat = await Deno.stat(editorActionsPath).catch(() => null);
  if (stat?.isFile) {
    await processEditorActionsFile(session, editorActionsPath);
  }

  const scriptWatcher = Deno.watchFs([`${worldDir}/src`, `${worldDir}/instructions`], {
    recursive: true,
  });
  const rootWatcher = Deno.watchFs(worldDir, { recursive: false });

  session.editWatcher = scriptWatcher;

  const touchedPaths = new Set<string>();
  const rebuild = debounce(async () => {
    await emitScriptEditNotifications(instance, [...touchedPaths], true);
    touchedPaths.clear();
  }, 60);

  const watchScriptChanges = async () => {
    for await (const event of scriptWatcher) {
      if (["modify", "create", "rename", "remove"].includes(event.kind)) {
        event.paths.forEach(p => touchedPaths.add(p));
        rebuild();
      }
    }
  };

  const watchEditorActions = async () => {
    for await (const event of rootWatcher) {
      if (!event.paths.includes(editorActionsPath)) continue;
      if (event.kind === "create" || event.kind === "modify") {
        await processEditorActionsFile(session, editorActionsPath);
      } else if (event.kind === "remove") {
        session.broadcastPacket({
          t: "EditorActions",
          actions: [],
        });
      }
    }
  };

  await Promise.all([watchScriptChanges(), watchEditorActions()]);
}

function parseEditorActionsXml(
  content: string,
): Array<{ editDescription: string; editCode: string }> {
  const actions: Array<{ editDescription: string; editCode: string }> = [];
  const editorBlockRegex = /<editor>([\s\S]*?)<\/editor>/g;

  let match;
  while ((match = editorBlockRegex.exec(content)) !== null) {
    const block = match[1];

    const descMatch = /<editDescription>([\s\S]*?)<\/editDescription>/.exec(block);
    const codeMatch = /<editCode>([\s\S]*?)<\/editCode>/.exec(block);

    if (descMatch && codeMatch) {
      actions.push({
        editDescription: descMatch[1].trim(),
        editCode: codeMatch[1].trim(),
      });
    }
  }

  return actions;
}

async function processEditorActionsFile(session: GameSession, filePath: string) {
  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    const stat = await Deno.stat(filePath).catch(() => null);
    if (!stat) return;

    const content = await Deno.readTextFile(filePath);
    const actions = parseEditorActionsXml(content);

    session.broadcastPacket({
      t: "EditorActions",
      actions: actions,
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return;
  }
}
