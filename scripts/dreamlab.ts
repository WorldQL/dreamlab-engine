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
  .name("dreamlab")
  .command(
    "up [path:string]",
    "Start the Dreamlab Engine in a project directory. Defaults to cwd",
  )
  .action(async (_opts: any, dir = Deno.cwd()) => {
    intro(color.bgCyan(" dreamlab up "));

    const exists = await fs.exists(path.join(dir, "project.json"));
    if (!exists) {
      log.error("not a valid dreamlab project");
      Deno.exit(1);
    }

    // Create symlink to dreamlab engine root if it doesn't exist
    {
      const sourcePath = Deno.env.get("DREAMLAB_DIR") ?? DREAMLAB_ROOT;
      const targetPath = path.join(dir, ".dreamlab-engine");

      const symlinkExists = await fs.exists(targetPath);
      if (!symlinkExists) {
        try {
          await Deno.symlink(sourcePath, targetPath);
          log.success(
            "Created symlink for engine dependencies. IntelliSense will now function properly. You may need to reload your code editor.",
          );
        } catch (error) {
          log.warning(`Failed to create symlink: ${error}`);
        }
      }
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

    const shutdown = (code?: number) => {
      try {
        serverHandle.kill();
      } catch {
        // pass
      }

      try {
        editorHandle.kill();
      } catch {
        // pass
      }

      Deno.exit(code);
    };

    Deno.addSignalListener("SIGINT", () => {
      shutdown();
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

    serverHandle.status.then(({ success }) => {
      if (!success) {
        serverStarted.reject();
        return;
      }

      console.log("Dreamlab server exited");
      shutdown();
    });

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

    editorHandle.status.then(({ success }) => {
      if (!success) {
        editorStarted.reject();
        return;
      }

      console.log("Dreamlab Editor exited");
      shutdown();
    });

    const s1 = spinner();
    s1.start("Starting Dreamlab server");
    try {
      await serverStarted.promise;
    } catch {
      s1.stop("Failed to start Dreamlab server. Is one already running?", 2);
      shutdown(1);
    }
    s1.stop("Dreamlab server ready");

    try {
      await editorStarted.promise;
    } catch {
      log.error("Failed to start Editor. Is one already running?");
      shutdown(1);
    }

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
