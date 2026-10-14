// Flow contract: shared-package guidance describes owned data capabilities without maintaining a consumer or product matrix.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('defines a neutral data-package boundary', async () => {
  const architecture = await readFile(new URL('../docs/SDK_LAYERING.md', import.meta.url), 'utf8')

  assert.match(architecture, /product-neutral data-contract package/i)
  assert.match(architecture, /does not list,\s+name or maintain a matrix of consumers/i)
  assert.match(architecture, /Runtime orchestration|runtime and application layers/i)
  assert.match(architecture, /Kept outside.*Consumer repository topology/is)
})

test('documents a consumer-independent local-first release order', async () => {
  for (const file of ['README.md', 'SYNC.md']) {
    const text = await readFile(new URL(`../${file}`, import.meta.url), 'utf8')
    assert.match(text, /validated shared dependency source.*main/is, file)
    assert.match(text, /affected local journey.*without skips/is, file)
    assert.match(text, /pin exact registry\s+versions and lockfiles/is, file)
  }
})
