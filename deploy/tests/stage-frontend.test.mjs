import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { stageFrontend } from '../stage-frontend.mjs'

test('stages a complete build, removes obsolete assets and keeps the embed placeholder', () => {
  const root = mkdtempSync(join(tmpdir(), 'frontend-stage-test-'))
  try {
    const source = join(root, 'source')
    const target = join(root, 'embed/dist')
    mkdirSync(join(source, 'assets'), { recursive: true })
    mkdirSync(target, { recursive: true })
    writeFileSync(join(source, 'index.html'), '<html>new</html>')
    writeFileSync(join(source, 'assets/app.js'), 'new asset')
    writeFileSync(join(target, 'obsolete.js'), 'old asset')
    stageFrontend(source, target)
    assert.equal(readFileSync(join(target, 'index.html'), 'utf8'), '<html>new</html>')
    assert.equal(readFileSync(join(target, 'assets/app.js'), 'utf8'), 'new asset')
    assert.deepEqual(readdirSync(target).sort(), ['.keep', 'assets', 'index.html'])
    assert.deepEqual(readdirSync(join(root, 'embed')), ['dist'])
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('a missing or incomplete build leaves the previous frontend intact', () => {
  const root = mkdtempSync(join(tmpdir(), 'frontend-stage-test-'))
  try {
    const source = join(root, 'missing')
    const target = join(root, 'embed/dist')
    mkdirSync(target, { recursive: true })
    writeFileSync(join(target, 'index.html'), 'previous')
    assert.throws(() => stageFrontend(source, target), /Missing frontend index/)
    mkdirSync(source)
    assert.throws(() => stageFrontend(source, target), /Missing frontend index/)
    assert.equal(readFileSync(join(target, 'index.html'), 'utf8'), 'previous')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
