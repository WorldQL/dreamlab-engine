import { readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path/posix'
import { defineConfig } from 'tsup'

export default defineConfig(async options => {
  const outDir = './dist'
  const entryDir = './src/exports'
  const modules = await readdir(entryDir)

  return {
    outDir,
    entry: modules.map(path => join(entryDir, path)),

    target: 'es2021',
    format: 'esm',
    platform: 'neutral',

    clean: true,
    minify: !options.watch,

    dts: true,
    sourcemap: true,

    keepNames: true,
    skipNodeModulesBundle: true,

    async onSuccess() {
      const trimmed = modules.map(entry => entry.replaceAll('.ts', ''))
      const json = JSON.stringify(trimmed)

      const path = join(outDir, 'modules.json')
      await writeFile(path, json)
    },
  }
})
