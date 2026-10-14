// Flow contract: maintained shared-package narratives describe owned capabilities without naming downstream products or repositories.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const downstreamProductLanguage = new RegExp([
  ['u', 'h', 'c'].join(''),
  ['u', 'n', 'i', 'd'].join(''),
  ['vet', 'chain'].join(''),
  ['pet', 'chain'].join(''),
  String.raw`\b${['v', 'e', 't'].join('')}\b`,
  String.raw`(?:vet|uhc)-\*`,
  String.raw`(?:vet|uhc)-sdk-(?:core|node)-ts`,
].join('|'), 'iu')

test('keeps public shared-package narratives independent of downstream products', () => {
  const files = execFileSync('git', ['ls-files', 'README.md', 'SYNC.md', 'docs/*.md', '.codex/**/*.md'], {
    encoding: 'utf8',
  }).trim().split('\n').filter((file) => file && existsSync(file))

  for (const file of files) {
    const content = readFileSync(file, 'utf8')
    assert.doesNotMatch(content, downstreamProductLanguage, file)
  }
})
