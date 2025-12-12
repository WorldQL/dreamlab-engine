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

type Template = {
  readonly label: string;
  readonly directory: string;
  readonly repo: string | undefined;
  readonly hint?: string;
};

const TEMPLATES: [Template, ...(readonly Template[])] = [
  {
    label: "OpenMonsters",
    directory: "openmonsters",
    repo: "https://github.com/WorldQL/openmonsters.git",
    hint: "recommended",
  },
  {
    label: "Blank",
    directory: "dreamlab-project",
    repo: undefined,
  },
];

async function task(title: string, task: Task["task"]) {
  await tasks([{ title, task }]);
}

if (import.meta.main) {
  let updatedShell: "bash" | "zsh" | undefined;
  // detect shell type and inject `wql` alias
  try {
    const shell = detectDefaultShell();

    // TODO: other shell types?
    if (shell === "/bin/bash" || shell === "/bin/zsh") {
      const rcFile = (() => {
        const zDotDir = Deno.env.get("ZDOTDIR");
        if (shell === "/bin/zsh" && zDotDir) {
          return path.join(zDotDir, ".zshrc");
        }

        const rc = shell === "/bin/bash" ? ".bashrc" : ".zshrc";
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

        updatedShell = shell === "/bin/bash" ? "bash" : "zsh";
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

  const template = await select({
    message: "Pick a project template:",
    options: TEMPLATES.map(
      template => ({ label: template.label, value: template, hint: template.hint }) as const,
    ),
  });
  if (isCancel(template)) Deno.exit(1);

  let directory: string | symbol | undefined = await text({
    message: "Project directory name:",
    placeholder: template.directory,
    validate: value => {
      const dir = path.join(Deno.cwd(), value === "" ? template.directory : value);
      const exists = fs.existsSync(dir);
      if (exists) return "Already exists";

      return undefined;
    },
  });
  if (isCancel(directory)) Deno.exit(1);

  directory ??= template.directory;
  const fullPath = path.join(Deno.cwd(), directory);

  // TODO: show a confirmation step?
  // const shoudClone = await confirm({
  //   message: "",
  // });
  // if (isCancel(shoudClone)) Deno.exit(1);
  // if (!shouldClone) {
  //   cancel('Operation cancelled')
  //   Deno.exit(0)
  // }

  if (template.repo === undefined) {
    await task("Creating blank project", async () => {
      await fs.emptyDir(fullPath);
      await Deno.writeTextFile(
        path.join(fullPath, "project.json"),
        JSON.stringify(projectTemplate(), null, 2) + "\n",
      );
      await Deno.writeTextFile(
        path.join(fullPath, "deno.json"),
        JSON.stringify(denoJson(DREAMLAB_ROOT), null, 2) + "\n",
      );

      await fs.ensureDir(path.join(fullPath, "src"));
      await Deno.writeTextFile(path.join(fullPath, "src", "hello-world.ts"), helloWorldScript);

      return "Created blank project";
    });
  } else {
    const repo = template.repo;
    await task(`Cloning Template: "${template.label}"`, async () => {
      const cmd = new Deno.Command("git", {
        args: ["clone", "--depth=1", repo, fullPath],
      });

      const result = await cmd.output();
      if (!result.success) {
        log.error("Failed to clone template!");
        Deno.exit(1);
      }

      // clear git history
      await Deno.remove(path.join(fullPath, ".git"), { recursive: true });

      // write correct deno.json
      await Deno.writeTextFile(
        path.join(fullPath, "deno.json"),
        JSON.stringify(denoJson(DREAMLAB_ROOT), null, 2) + "\n",
      );

      return `Cloned Template: "${template.label}"`;
    });

    // TODO: prompt to initialize a fresh git repo?
  }

  const notes: (string | false)[] = [
    updatedShell === "bash" && "$ source ~/.bashrc",
    updatedShell === "zsh" && "$ source ~/.zshrc",

    `$ cd ${directory} && wql up`,
  ];
  note(notes.filter(line => line !== false).join("\n"), "Next steps:");

  outro(`You're good to go!`);
  Deno.exit(0);
}
