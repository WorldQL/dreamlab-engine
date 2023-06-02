import { defineConfig } from 'tsup'
import type { Options } from 'tsup'

export function createTsupConfig({
  entry = ['./src/index.ts'],
  external = [],
  noExternal = [],
  platform = 'node',
  format = 'esm',
  target = 'es2022',
  skipNodeModulesBundle = true,
  clean = true,
  shims = true,
  minify = false,
  splitting = false,
  keepNames = true,
  dts = true,
  sourcemap = true,
}: Options = {}) {
  return defineConfig({
    entry,
    external,
    noExternal,
    platform,
    format,
    skipNodeModulesBundle,
    target,
    clean,
    shims,
    minify,
    splitting,
    keepNames,
    dts,
    sourcemap,
  })
}

export default createTsupConfig({
  shims: false,
  splitting: true,

  entry: [
    './src/exports/index.ts',
    './src/exports/debug.ts',
    './src/exports/entities.ts',
    './src/exports/input.ts',
    './src/exports/math.ts',
  ],
})
