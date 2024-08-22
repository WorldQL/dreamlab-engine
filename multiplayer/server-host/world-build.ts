export const buildWorld = async (
  world: string,
  worldDir: string,
  outDirName: "_dist" | "_dist_play" | (string & {}),
) => {
  const subprocess = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      "./build-worker/main.ts",
      `--world=${world}`,
      `--dir=${worldDir}`,
      `--out=${outDirName}`,
    ],
    cwd: Deno.cwd(),
  }).spawn();
  await subprocess.status;
};
