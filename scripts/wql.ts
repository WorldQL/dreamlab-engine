#!/usr/bin/env -S deno run --ext=ts -A
// deno-lint-ignore-file no-import-prefix no-explicit-any
import { Command } from "jsr:@cliffy/command@1.0.0-rc.8";
import * as fs from "jsr:@std/fs@^1";
import * as path from "jsr:@std/path@^1";
import { stripVTControlCharacters } from "node:util";
import { intro, log, outro, spinner } from "npm:@clack/prompts@^0.11.0";
import color from "npm:picocolors@^1.1.1";

const DREAMLAB_ROOT = path.join(path.fromFileUrl(import.meta.url), "../..");

const cli = new Command()
  .name("wql")
  .command(
    "up [path:string]",
    "Start the Dreamlab Engine in a project directory. Defaults to cwd",
  )
  .action(async (_opts: any, dir = Deno.cwd()) => {
    intro(color.bgCyan(" wql up "));

    const exists = await fs.exists(path.join(dir, "project.json"));
    if (!exists) {
      log.error("not a valid dreamlab project");
      Deno.exit(1);
    }

    const serverCmd = new Deno.Command(Deno.execPath(), {
      cwd: DREAMLAB_ROOT,
      args: ["task", "run-server", dir],
      stdout: "piped",
      stderr: "piped",
    });

    const editorCmd = new Deno.Command(Deno.execPath(), {
      cwd: DREAMLAB_ROOT,
      args: ["task", "run-editor"],
      stdout: "piped",
      stderr: "piped",
    });

    const serverHandle = serverCmd.spawn();
    const editorHandle = editorCmd.spawn();

    Deno.addSignalListener("SIGINT", () => {
      serverHandle.kill();
      editorHandle.kill();
      Deno.exit();
    });

    const serverStarted = Promise.withResolvers<void>();
    void (async () => {
      const decoder = new TextDecoder();
      for await (const chunk of serverHandle.stdout.values({ preventCancel: true })) {
        const line = decoder.decode(chunk);
        const clean = stripVTControlCharacters(line);
        if (clean.includes(`status="Started"`)) {
          serverStarted.resolve();
          break;
        }
      }
    })();

    const editorStarted = Promise.withResolvers<void>();
    void (async () => {
      const decoder = new TextDecoder();
      for await (const chunk of editorHandle.stdout.values({ preventCancel: true })) {
        const line = decoder.decode(chunk);
        const clean = stripVTControlCharacters(line);
        if (clean.includes(`Listening on:`)) {
          editorStarted.resolve();
          break;
        }
      }
    })();

    const s1 = spinner();
    s1.start("Starting Dreamlab server");
    await serverStarted.promise;
    s1.stop("Dreamlab server ready");

    await editorStarted.promise;

    outro(`Open Dreamlab @ http://localhost:5173`);

    const stdout = Deno.stdout.writable.getWriter();
    for await (const chunk of serverHandle.stdout.values({ preventCancel: true })) {
      await stdout.write(chunk);
    }
  })
  .reset()
  .action(() => {
    cli.showHelp();
  });

if (import.meta.main) {
  await cli.parse(Deno.args);
}
