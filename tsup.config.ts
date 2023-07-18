import { readdir } from 'node:fs/promises'
import { join } from 'node:path/posix'
import { defineConfig } from 'tsup'

export default defineConfig(async options => {
  const entryDir = './src/exports'
  const entry = await readdir(entryDir)

  return {
    entry: entry.map(path => join(entryDir, path)),

    target: 'es2021',
    format: 'esm',
    platform: 'neutral',

    clean: true,
    minify: !options.watch,

    dts: true,
    sourcemap: true,

    keepNames: true,
    skipNodeModulesBundle: true,
  }
})
