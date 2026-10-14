// Flow contract: SOS pins the exact locally validated neutral FHIR package and never relies on an unpublished older transitive version.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('pins the exact validated neutral FHIR package', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const installed = JSON.parse(
    await readFile(new URL('../node_modules/fhir-data-utils-ts/package.json', import.meta.url), 'utf8'),
  )

  assert.equal(installed.name, 'fhir-data-utils-ts')
  assert.equal(manifest.dependencies['fhir-data-utils-ts'], installed.version)
})
