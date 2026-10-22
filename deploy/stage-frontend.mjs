import { cpSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Publish a completed build, keeping the previous assets if validation or copying fails. */
export function stageFrontend(source, destination) {
  if (!existsSync(join(source, 'index.html'))) {
    throw new Error(`Missing frontend index.html: ${source}`)
  }
  mkdirSync(dirname(destination), { recursive: true })
  const temporary = mkdtempSync(join(dirname(destination), '.frontend-stage-'))
  const staged = join(temporary, 'dist')
  const previous = join(temporary, 'previous')
  let movedPrevious = false
  try {
    cpSync(source, staged, { recursive: true, errorOnExist: true })
    writeFileSync(join(staged, '.keep'), '')
    if (existsSync(destination)) {
      renameSync(destination, previous)
      movedPrevious = true
    }
    try {
      renameSync(staged, destination)
    } catch (error) {
      if (movedPrevious) renameSync(previous, destination)
      throw error
    }
  } finally {
    // Keep the previous build available if the filesystem also rejects rollback.
    if (!existsSync(previous) || existsSync(destination)) {
      rmSync(temporary, { recursive: true, force: true })
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  stageFrontend(join(repositoryRoot, 'frontend2/dist'), join(repositoryRoot, 'backend/internal/web/dist'))
  console.log('Frontend2 assets staged for Go embed.')
}
