import { LevelSchema, SpawnableDefinitionSchema } from '../dist/index.js'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const schemaDir = './schemas'
await mkdir(schemaDir, { recursive: true })

const writeSchema = async (name, schema) => {
  const json = zodToJsonSchema(schema)
  const path = join(schemaDir, `${name}.schema.json`)

  await writeFile(path, JSON.stringify(json, null, 2))
}

await Promise.all([
  writeSchema('level', LevelSchema),
  writeSchema('spawnable-definition', SpawnableDefinitionSchema),
])
