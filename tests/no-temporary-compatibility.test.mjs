// Flow contract: shared packages expose each contract from its single owning layer and never retain temporary reexport subpaths or product-prefixed aliases.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

test('does not expose FHIR compatibility subpaths from the SOS data package', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(packageJson.exports['./coding-review-flat-claims'], undefined)
  assert.equal(packageJson.exports['./flat-claim-resource-graph'], undefined)
})
