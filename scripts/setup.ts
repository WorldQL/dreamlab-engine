#!/usr/bin/env -S deno run --ext=ts -A
// deno-lint-ignore-file no-import-prefix
import * as fs from "jsr:@std/fs@^1";
import * as path from "jsr:@std/path@^1";
import { homedir } from "node:os";
import {
  intro,
  isCancel,
  log,
  note,
  outro,
  select,
  tasks,
  text,
  type Task,
} from "npm:@clack/prompts@^0.11.0";
import { detectDefaultShell } from "npm:default-shell@^2.2.0";
import color from "npm:picocolors@^1.1.1";
import { denoJson, helloWorldScript, projectTemplate } from "./_utils/generate-project.ts";
import { initEditorEnv, initServerEnv } from "./_utils/init-env.ts";

const DREAMLAB_ROOT = path.join(path.fromFileUrl(import.meta.url), "../..");

async function task(title: string, task: Task["task"]) {
  await tasks([{ title, task }]);
}

if (import.meta.main) {
  let updatedShell: "bash" | "zsh" | undefined;
  // detect shell type and inject `wql` alias
  try {
    const shell = detectDefaultShell();
    const shellName = path.basename(shell);

    // TODO: other shell types?
    if (shellName === "bash" || shellName === "zsh") {
      const rcFile = (() => {
        const zDotDir = Deno.env.get("ZDOTDIR");
        if (shellName === "zsh" && zDotDir) {
          return path.join(zDotDir, ".zshrc");
        }

        const rc = shellName === "bash" ? ".bashrc" : ".zshrc";
        return path.join(homedir(), rc);
      })();

      const content = await Deno.readTextFile(rcFile);
      using rc = await Deno.open(rcFile, { read: true, append: true });

      if (!content.includes(`alias wql='`)) {
        const writer = rc.writable.getWriter();
        await writer.ready;

        const encoder = new TextEncoder();
        if (!content.endsWith("\n")) await writer.write(encoder.encode("\n"));
        await writer.write(encoder.encode(`export DREAMLAB_DIR="${DREAMLAB_ROOT}"\n`));
        await writer.write(
          encoder.encode(
            `alias wql='${Deno.execPath()} run -A "$DREAMLAB_DIR/scripts/wql.ts"'\n`,
          ),
        );

        await writer.ready;
        await writer.close();

        updatedShell = shellName === "bash" ? "bash" : "zsh";
      }
    }
  } catch (_error) {
    // uncomment when debugging
    // console.error(_error);
  }

  intro(color.bgCyan(" WorldQL Setup "));

  // await task("Initializing Dreamlab environment", async () => {
  //   await Promise.all([initEditorEnv(DREAMLAB_ROOT), initServerEnv(DREAMLAB_ROOT)]);
  //   return "Initialized Dreamlab environment. This is the game engine that powers WorldQL!";
  // });
  // bug in Clack. Using task followed by select causes the first key input to be ignored.

  await Promise.all([initEditorEnv(DREAMLAB_ROOT), initServerEnv(DREAMLAB_ROOT)]);

  log.success("Initialized Dreamlab environment. This is the game engine that powers WorldQL!");

  // Clone https://github.com/WorldQL/worldql into cwd. Inform the user that it has been cloned with the full path.
  await task("Cloning WorldQL repository", async () => {
    const cwd = Deno.cwd();
    const worldqlPath = path.join(cwd, "worldql");

    // Check if worldql directory already exists
    if (await fs.exists(worldqlPath)) {
      return `WorldQL already exists at ${worldqlPath}`;
    }

    const command = new Deno.Command("git", {
      args: ["clone", "https://github.com/WorldQL/worldql", "worldql"],
      cwd,
    });

    const { code } = await command.output();

    if (code !== 0) {
      throw new Error("Failed to clone WorldQL repository");
    }

    return `Cloned WorldQL repository to ${worldqlPath}`;
  });

  outro(`You're good to go!`);

  if (updatedShell) {
    console.log(
      color.underline(
        "To start your project, first run this command to reload your shell configuration:",
      ),
    );

    console.log(
      [
        updatedShell === "bash" && "source ~/.bashrc",
        updatedShell === "zsh" && "source ~/.zshrc",
      ]
        .filter(cmd => cmd !== false)
        .at(0),
    );
    console.log();
    console.log(color.underline("Then, to run the openmonsters sample project, run:"));
    console.log(`cd worldql/environments/openmonsters && wql up`);
  } else {
    console.log(color.underline("To run the openmonsters sample project, run:"));
    console.log(`cd worldql/environments/openmonsters && wql up`);
  }

  Deno.exit(0);
}
