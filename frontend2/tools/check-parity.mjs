import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, relative, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseline = JSON.parse(readFileSync(join(root, 'parity-baseline.json'), 'utf8'))
const errors = []
const hash = text => createHash('sha256').update(text).digest('hex')

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === '__tests__') return []
    const path = join(directory, entry.name)
    return entry.isDirectory() ? files(path) : /\.(ts|vue)$/.test(entry.name) && !/\.(spec|test)\.ts$/.test(entry.name) ? [path] : []
  })
}

// Routes and backend contracts remain byte-identical to the pinned source baseline.
for (const [file, expected] of Object.entries(baseline.contracts)) {
  const path = join(root, file)
  if (!existsSync(path)) errors.push(`Missing contract: ${file}`)
  else if (hash(readFileSync(path, 'utf8')) !== expected) errors.push(`Contract changed; review and update baseline explicitly: ${file}`)
}
for (const file of baseline.runtimeFiles) {
  if (!existsSync(join(root, file))) errors.push(`Missing migrated runtime file: ${file}`)
}
for (const path of files(join(root, 'src'))) {
  const text = readFileSync(path, 'utf8')
  if (/\b(?:from\s*|import\s*\()\s*['"][^'"]*\bfrontend\/src\//.test(text)) {
    errors.push(`Cross-project source import: ${relative(root, path)}`)
  }
}

// Moving settings into panels must not drop a bound field, including nested quotas.
const settings = readdirSync(join(root, 'src/views/admin/settings/sections'))
  .filter(file => file.endsWith('.vue'))
  .map(file => readFileSync(join(root, 'src/views/admin/settings/sections', file), 'utf8'))
  .join('\n') + readFileSync(join(root, 'src/views/admin/SettingsView.vue'), 'utf8')
const models = [...new Set([...settings.matchAll(/v-model(?::[\w-]+)?(?:\.[\w-]+)*="([^"]+)"/g)].map(match => match[1]))].sort()
for (const model of baseline.settingsModels) {
  if (!models.includes(model)) errors.push(`Missing settings binding: ${model}`)
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Parity inventory OK: ${baseline.routes.length} routes, ${baseline.runtimeFiles.length} runtime files, ${Object.keys(baseline.contracts).length} contracts, ${baseline.settingsModels.length} settings bindings.`)
  console.log('Static coverage is not a substitute for browser and provider integration tests.')
}
