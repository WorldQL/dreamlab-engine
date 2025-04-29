import { TextLineStream } from "@std/streams";
import { LogStore } from "./log-store.ts";

export const buildWorld = async (
  world: string,
  worldDir: string,
  outDirName: "_dist" | "_dist_play" | (string & {}),
  logs?: LogStore,
) => {
  const subprocess = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-lock",
      "-A",
      "./build-worker/main.ts",
      `--world=${world}`,
      `--dir=${worldDir}`,
      `--out=${outDirName}`,
    ],
    cwd: Deno.cwd(),

    stdout: logs ? "piped" : "inherit",
    stderr: logs ? "piped" : "inherit",
  }).spawn();

  if (logs) {
    const outLines = subprocess.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());
    const errLines = subprocess.stderr
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());

    void (async () => {
      for await (const line of outLines.values()) {
        console.log(line);
        logs.log("stdout", line);
      }
    })();
    void (async () => {
      for await (const line of errLines.values()) {
        console.error(line);
        logs.log("stderr", line);
      }
    })();
  }

  await subprocess.status;
};
